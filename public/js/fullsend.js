const getGroups = async () => {
  const isLoggedIn = (await checkLogin()).data[0].user_id;
  if (isLoggedIn) {
    return (await (await fetch("/api/groups")).json()).data;
  }
};

const getContactNumbersInGroup = async (group) => {
  let numbers = [];
  const contacts = (await (await fetch(`/api/group/${group}/contacts`)).json())
    .data;
  for (contact of contacts) {
    numbers.push(contact.phone_number);
  }
  console.log(numbers);
};

const getRecipientGroups = () => {
  let recipientGroups = [];
  const checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
  for (const checkbox of checkboxes) {
    recipientGroups.push(checkbox.value);
  }
  return recipientGroups;
};

const sendMessage = async () => {
  let error = false;
  document.getElementById("noMessageError").style.display = "none";
  document.getElementById("noRecipientsError").style.display = "none";
  const message = document.getElementById("fullsendMessage").value;
  if (/^\s*$/.test(message)) {
    document.getElementById("noMessageError").style.display = "block";
    error = true;
  }
  const recipientGroups = getRecipientGroups();
  if (recipientGroups.length == 0) {
    document.getElementById("noRecipientsError").style.display = "block";
    error = true;
  }
  if (error) return -1;

  const session = getCookie("fullsend_session");
  const result = await fetch("/api/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", session: session },
    body: JSON.stringify({
      message: message,
      groups: recipientGroups,
    }),
  });
  document.getElementById(
    "alert-placeholder"
  ).innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert">
  Your message has been sent!
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;
};

window.onload = async () => {
  const session = getCookie("fullsend_session");

  if (session) {
    (async () => {
      const sessionInfo = (await checkLogin(session)).data;
      if ((await sessionInfo).length == 0) {
        logout();
      }
    })();
  } else {
    window.location.href = "/";
  }

  const groups = await getGroups();
  for (const group of groups) {
    document.getElementById(
      "fullsendRecipients"
    ).innerHTML += `<input class="form-check-input" type="checkbox" role="switch" value=${group.id} id="recipientSwitch-${group.id}">
    <label class="form-check-label" for="recipientSwitch-${group.id}">${group.name}</label><br>
    `;
  }
};
