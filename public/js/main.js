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

const logout = () => {
  const session = getCookie("fullsend_session");
  fetch("/api/logout", { headers: { session: session } });
  document.cookie = "fullsend_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  window.location.href = "/";
};

const isAdmin = async (userId) => {
  const session = getCookie("fullsend_session");
  const userInfo = (
    await (
      await fetch(`/auth/api/user/${userId}`, {
        headers: { session: session },
      })
    ).json()
  ).data[0];
  return userInfo.admin;
};

window.onload = () => {
  const session = getCookie("fullsend_session");
  if (session) {
    (async () => {
      const sessionInfo = await checkLogin();
      if (!sessionInfo && window.href.location != "") {
        window.location.href = "/";
      }
    })();
  } else if (window.href.location != "") {
    window.location.href = "/";
  }
  printVersionInNav();
};
