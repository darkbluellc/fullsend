// cookie helper removed — server now manages sessions via OIDC

const getVersion = async () => {
  const version = (await fetch("/api/version")).text();
  return version;
};

const printVersionInNav = async () => {
  document.getElementById("navVersion").text = await getVersion();
};

const checkLogin = async () => {
  // Ask the server for session info (server reads token from session or Authorization)
  const resp = await fetch('/auth/api/session/info');
  if (resp.status === 200) return resp.json();
  return { success: false };
};

const isLoggedIn = async () => {
  const info = await checkLogin();
  return info && info.success;
};

const isAdmin = async (userId = null) => {
  const info = await checkLogin();
  if (!info || !info.success) return false;
  // If server returned localUser, respect that flag; otherwise inspect claims
  if (info.data && info.data.localUser && info.data.localUser.admin) return true;
  const claims = info.data && info.data.sessionInfo && info.data.sessionInfo.claims;
  if (!claims) return false;
  const realmRoles = (claims.realm_access && claims.realm_access.roles) || [];
  if (realmRoles.includes(process.env.KEYCLOAK_ADMIN_ROLE || 'admin')) return true;
  if (claims.resource_access && process.env.KEYCLOAK_CLIENT) {
    const ra = claims.resource_access[process.env.KEYCLOAK_CLIENT];
    if (ra && ra.roles && ra.roles.includes(process.env.KEYCLOAK_ADMIN_ROLE || 'admin')) return true;
  }
  return false;
};

const logout = async () => {
  try {
    window.location.href = '/api/logout';
  } catch (e) {
    console.error('Logout failed', e);
    window.location.href = '/';
  }
};

const checkForRedirect = async () => {
  // if (window.location.pathname == "/") return;

  const forwardPages = ["/", "/login"];
  const authPages = ["/fullsend"];
  const adminPages = ["/changepassword", "/group-management"];

  const isLoggedInVar = (await isLoggedIn()) ? true : false;

  for (const page of forwardPages) {
    if (window.location.pathname == page && isLoggedInVar) {
      window.location.href = "/fullsend";
    }
  }

  for (const page of [authPages, adminPages]) {
    if (window.location.pathname == page && !isLoggedInVar) {
      window.location.href = "/";
      return;
    }
  }
  const isAdminVar = (await isAdmin()) ? true : false;
  for (const page of adminPages) {
    if (window.location.pathname == page && !isAdminVar) {
      window.location.href = "/fullsend";
      return;
    }
  }
};

checkForRedirect();

window.onload = async () => {
  printVersionInNav();
  pageOnLoadFunctions();

  if (await isAdmin())
    document.getElementById("adminNavLink").style.display = "block";
};
