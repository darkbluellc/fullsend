window.onload = () => {
  const session = getCookie("fullsend_session");

  if (session) {
    async () => {
      const sessionInfo = (await checkLogin(session)).data;
      if ((await sessionInfo).length != 0) window.location.href = "/fullsend";
    };
  }
};
