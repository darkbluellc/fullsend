const pageOnLoadFunctions = async () => {
  const session = getCookie("fullsend_session");

  if (session) {
    (async () => {
      const sessionInfo = (await checkLogin()).data;
      if ((await sessionInfo).length != 0) window.location.href = "/fullsend";
    })();
  }
};
