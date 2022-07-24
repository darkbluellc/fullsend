//TODO: this doesn't actually need isLoggedIn here, I don't think...
//Pretty sure the redirect if not logged in (line 73ish) will cover that
const getGroups = async () => {
  const session = getCookie("fullsend_session");
  const isLoggedIn = (await checkLogin()).data[0].user_id;
  if (isLoggedIn) {
    return (
      await (
        await fetch("/auth/api/groups", { headers: { session: session } })
      ).json()
    ).data;
  }
};

const getContactNumbersInGroup = async (group) => {
  const session = getCookie("fullsend_session");
  let numbers = [];
  const contacts = (
    await (
      await fetch(`/auth/api/group/${group}/contacts`, {
        headers: { session: session },
      })
    ).json()
  ).data;
  for (const contact of contacts) {
    numbers.push(contact.phone_number);
  }
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
  const result = await fetch("/auth/api/messages/send", {
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

  document.getElementById("fullsendForm").reset();
};

const pageOnLoadFunctions = async () => {
  const groups = await getGroups();
  for (const group of groups) {
    document.getElementById(
      "fullsendRecipients"
    ).innerHTML += `<input class="form-check-input" type="checkbox" role="switch" value=${group.id} id="recipientSwitch-${group.id}">
    <label class="form-check-label" for="recipientSwitch-${group.id}">${group.name}</label><br>
    `;
  }
};
