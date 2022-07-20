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
  const message = document.getElementById("fullsendMessage").value;
  const recipientGroups = getRecipientGroups();
  const session = getCookie("fullsend_session");
  const result = await fetch("/api/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", session: session },
    body: JSON.stringify({
      message: message,
      groups: recipientGroups,
    }),
  });
};

window.onload = async () => {
  const groups = await getGroups();
  for (const group of groups) {
    document.getElementById(
      "fullsendRecipients"
    ).innerHTML += `<input class="form-check-input" type="checkbox" role="switch" value=${group.id} id="recipientSwitch-${group.id}">
    <label class="form-check-label" for="recipientSwitch-${group.id}">${group.name}</label><br>
    `;
  }
};
