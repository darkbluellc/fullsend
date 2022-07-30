const login = async () => {
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const session = await (
    await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        password: password,
      }),
    })
  ).json();

  if (session.code && session.code == 403) {
    return handle403();
  }

  const days = 5;
  const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();

  document.cookie = `fullsend_session=${await session.session}; expires=${expires}`;

  window.location.href = "/fullsend";
};

const handle403 = () => {
  document.getElementById("loginError").style.display = "block";
};

window.onload = () => {
  const session = getCookie("fullsend_session");
  if (session) {
    (async () => {
      const sessionInfo = (await checkLogin(session)).data;
      if ((await sessionInfo).length != 0) {
        window.location.href = "/fullsend";
      } else {
        console.log("expiring...");
        document.cookie =
          "fullsend_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      }
    })();
  }
};
