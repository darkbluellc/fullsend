const setLoggedOut = () => {
  document.getElementById("login").style.display = "block";
};

const setLoggedIn = () => {
  document.getElementById("logout").style.display = "block";
};

const pageOnLoadFunctions = async () => {
  if (await isLoggedIn()) {
    setLoggedIn();
  } else {
    setLoggedOut();
  }
};
