const loadUsers = async () => {
  const session = getCookie("fullsend_session");
  const users = (
    await (
      await fetch(`/auth/api/users`, {
        headers: { session: session },
      })
    ).json()
  ).data;
  for (const user of users) {
    document.getElementById(
      "changePasswordUsername"
    ).innerHTML += `<option value="${user.id}">${user.first_name} ${user.last_name}: ${user.username}</option>`;
  }
};

const changePassword = async () => {
  for (element of document.getElementsByClassName("invalid-feedback"))
    element.style.display = "none";

  const userId = document.getElementById("changePasswordUsername").value;
  const password = document.getElementById("changePasswordPassword").value;
  const passwordRepeat = document.getElementById(
    "changePasswordReenterPassword"
  ).value;

  let error = false;
  if (userId == "") {
    document.getElementById("changePasswordUserError").style.display = "block";
    error = true;
  }
  if (password == "" && passwordRepeat == "") {
    document.getElementById("changePasswordBlankError").style.display = "block";
    error = true;
  }
  if (password != passwordRepeat) {
    document.getElementById("changePasswordRepeatError").style.display =
      "block";
    error = true;
  }
  if (error) return -1;

  const session = getCookie("fullsend_session");

  const result = await fetch("/auth/api/users/update/password", {
    method: "POST",
    headers: { "Content-Type": "application/json", session: session },
    body: JSON.stringify({
      userId: userId,
      password: password,
    }),
  });
};

window.onload = async () => {
  const session = getCookie("fullsend_session");
  let sessionInfo;

  if (session) {
    (async () => {
      sessionInfo = (await checkLogin(session)).data;
      const userIsAdmin = await isAdmin(sessionInfo[0].user_id);
      if ((await sessionInfo).length == 0) {
        logout();
      } else if (!userIsAdmin) {
        window.location.href = "/fullsend";
      }
    })();
  } else {
    window.location.href = "/";
  }

  loadUsers();
};
