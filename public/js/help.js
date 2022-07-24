const setLoggedOut = () => {
  document.getElementById("login").style.display = "block";
};

const setLoggedIn = () => {
  document.getElementById("logout").style.display = "block";
};

window.onload = () => {
  const session = getCookie("fullsend_session");

  if (session) {
    (async () => {
      const sessionInfo = (await checkLogin()).data;
      if ((await sessionInfo).length != 0) {
        setLoggedIn();
      } else {
        setLoggedOut();
      }
    })();
  } else {
    setLoggedOut();
  }
};
