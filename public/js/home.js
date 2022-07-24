window.onload = () => {
  const session = getCookie("fullsend_session");
  console.log(session);

  if (session) {
    (async () => {
      const sessionInfo = (await checkLogin()).data;
      console.log((await sessionInfo).length);
      if ((await sessionInfo).length != 0) window.location.href = "/fullsend";
    })();
  }
};
