const getCookie = (cname) => {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return undefined;
};

const getVersion = async () => {
  const version = (await fetch("/api/version")).text();
  return version;
};

const printVersionInNav = async () => {
  document.getElementById("navVersion").text = await getVersion();
};

const checkLogin = async () => {
  const session = getCookie("fullsend_session");
  const login = (
    await fetch("/auth/api/session/" + session, {
      headers: { session: session },
    })
  ).json();
  if ((await login).code == 401) {
    logout();
  }
  return login;
};

const isLoggedIn = async () => {
  const session = getCookie("fullsend_session");
  if (!session) return false;
  const login = (
    await fetch("/auth/api/session/" + session, {
      headers: { session: session },
    })
  ).json();
  if ((await login).code == 401) {
    return false;
  }
  return true;
};

const isAdmin = async (userId = null) => {
  const session = getCookie("fullsend_session");
  if (!session) return;

  if (!userId) {
    userId = (await checkLogin()).data[0].user_id;
  }
  const userInfo = (
    await (
      await fetch(`/auth/api/user/${userId}`, {
        headers: { session: session },
      })
    ).json()
  ).data[0];
  return userInfo.admin;
};

const logout = () => {
  const session = getCookie("fullsend_session");
  fetch("/api/logout", { headers: { session: session } });
  document.cookie = "fullsend_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  window.location.href = "/";
};

const checkForRedirect = async () => {
  // if (window.location.pathname == "/") return;

  const forwardPages = ["/", "/login"];
  const authPages = ["/fullsend"];
  const adminPages = ["/changepassword"];

  const isLoggedInVar = (await isLoggedIn()) ? true : false;

  for (const page of forwardPages) {
    if (window.location.pathname == page && isLoggedInVar) {
      window.location.href = "/fullsend";
    }
  }

  for (const page of [authPages, adminPages]) {
    if (window.location.pathname == page && !isLoggedInVar) {
      logout();
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
