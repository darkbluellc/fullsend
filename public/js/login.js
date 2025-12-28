const handle403 = () => {
  document.getElementById("loginError").style.display = "block";
  return;
};

const login = async () => {
  // Redirect to server which initiates Keycloak login
  window.location.href = "/api/login";
};

const pageOnLoadFunctions = async () => {
  printVersionInNav();
};
