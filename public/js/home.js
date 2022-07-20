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
      const sessionInfo = await checkLogin(session);
      window.location.href = "/fullsend";
    })();
  } else {
    setAsLoggedOut();
  }
};
