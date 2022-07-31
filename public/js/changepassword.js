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

  document.getElementById(
    "alert-placeholder"
  ).innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert">
  Password changed successfully!
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;

  document.getElementById("changePasswordForm").reset();
};

const pageOnLoadFunctions = async () => {
  loadUsers();
};
