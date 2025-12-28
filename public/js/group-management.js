let recipientListReady = false;
let currentGroup;

const getGroups = async () => (await (await fetch("/auth/api/groups/insequence")).json()).data;

const loadContacts = async () => {
  const contacts = (await (await fetch("/auth/api/contacts?active=1")).json()).data;

  document.getElementById("groupManagementRecipientsLabel").style.display =
    "block";

  for (const contact of contacts) {
    document.getElementById(
      "groupManagementRecipients"
    ).innerHTML += `<input class="form-check-input recipient-switch" type="checkbox" role="switch" value=${contact.id} id="recipient-switch-${contact.id}" disabled onchange="handleSwitch(event);">
      <label class="form-check-label" for="recipient-switch-${contact.id}">${contact.first_name} ${contact.last_name}</label><br>
      `;
  }
};

const setGroupContacts = async (groupId) => {
  recipientListReady = false;

  const contacts = (await (await fetch(`/auth/api/group/${groupId}/contacts`)).json()).data;

  const checkboxes = document.getElementsByClassName("recipient-switch");
  for (const checkbox of checkboxes) {
    checkbox.disabled = false;
    checkbox.checked = false;
  }

  for (const contact of contacts) {
    document.getElementById(`recipient-switch-${contact.id}`).checked = true;
  }

  recipientListReady = true;
};

const handleSwitch = async (e) => {
  
  if (!recipientListReady) return;
  const userId = e.target.value;
  const action = e.target.checked ? "add" : "remove";

  if (action == "add") {
    const result = await fetch("/auth/api/groups/update/addcontact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: userId,
        groupId: currentGroup,
      }),
    });
    return result;
  } else if (action == "remove") {
    const result = await fetch("/auth/api/groups/update/removecontact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: userId,
        groupId: currentGroup,
      }),
    });
    return result;
  }
};

const pageOnLoadFunctions = async () => {
  const groups = await getGroups();
  const groupManagementSelect = document.getElementById(
    "groupManagementSelect"
  );

  for (const group of groups) {
    groupManagementSelect.innerHTML += `<option value="${group.id}">${group.name}</option>`;
  }

  loadContacts();

  groupManagementSelect.onchange = () => {
    const groupId = groupManagementSelect.value;
    setGroupContacts(groupId);
    currentGroup = groupId;
  };
};
