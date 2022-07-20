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

const checkLogin = async (session) => {
  return await (await fetch("/api/session/" + session)).json();
};

const setAsLoggedOut = () => {
  document.getElementById("logout").style.display = "none";
  document.getElementById("login").style.display = "block";
};

const setAsLoggedIn = () => {
  document.getElementById("login").style.display = "none";
  document.getElementById("logout").style.display = "block";
};

window.onload = () => {
  const session = getCookie("fullsend_session");

  if (session) {
    (async () => {
      // const sessionInfo = await checkLogin(session);
      setAsLoggedIn();
    })();
  }
};
