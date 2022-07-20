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

const logout = () => {
  document.cookie = "fullsend_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  window.location.href = "/";
};
