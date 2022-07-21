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
