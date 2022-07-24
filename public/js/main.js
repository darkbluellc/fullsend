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

const logout = () => {
  const session = getCookie("fullsend_session");
  fetch("/api/logout", { headers: { session: session } });
  document.cookie = "fullsend_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  window.location.href = "/";
};

const isAdmin = async (userId = null) => {
  const session = getCookie("fullsend_session");
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

const checkForRedirect = async () => {
  const publicPages = ["/", "/login", "/help"];
  const authPages = ["/fullsend"];
  const adminPages = ["/changepassword"];

  for (const page of publicPages) {
    if (window.location.pathname == page) return;
  }

  const isLoggedInVar = (await isLoggedIn()) ? true : false;

  for (const page of authPages) {
    if (window.location.href == page) {
      if (!isLoggedInVar && window.location.href != "/") {
        window.location.href = "/";
      }
    }
  }
  const isAdminVar = (await isAdmin()) ? true : false;
  for (const page of adminPages) {
    if (window.location.href == page) {
      if (isLoggedInVar && !isAdminVar) {
        window.location.href = "/fullsend";
      }
    }
  }
};

window.onload = () => {
  checkForRedirect();
  pageOnLoadFunctions();
};
