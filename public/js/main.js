// cookie helper removed — server now manages sessions via OIDC

const getVersion = async () => {
  const version = (await fetch("/api/version")).text();
  return version;
};

const getConfig = async () => {
  try {
    const resp = await fetch('/api/config');
    if (!resp.ok) return { success: false };
    return resp.json();
  } catch (e) {
    console.error('Failed to load config', e && e.message);
    return { success: false };
  }
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
  // Server should expose which role name represents admin; fall back to 'admin'
  const adminRole = (info.data && info.data.sessionInfo && info.data.sessionInfo.adminRole) || 'admin';
  if (realmRoles.includes(adminRole)) return true;
  if (claims.resource_access) {
    // Try to find admin role in any client resource_access entry
    for (const clientKey of Object.keys(claims.resource_access)) {
      const ra = claims.resource_access[clientKey];
      if (ra && ra.roles && ra.roles.includes(adminRole)) return true;
    }
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

  // load runtime config (DEV mode and sending enabled)
  const cfg = await getConfig();
  if (cfg && cfg.success && cfg.data) {
    window.APP_CONFIG = cfg.data;
    if (cfg.data.dev) {
      const nd = document.getElementById('navDev');
      if (nd) nd.style.display = 'block';
    }
    // If sending is disabled, disable send button to prevent user attempts
    if (!cfg.data.sendingEnabled) {
      const sendBtn = document.getElementById('sendButton');
      if (sendBtn) sendBtn.disabled = true;
    }
  }

  pageOnLoadFunctions();

  if (await isAdmin()) document.getElementById("adminNavLink").style.display = "block";
};
