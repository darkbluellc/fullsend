const safeJsonFetch = async (url, options = {}) => {
  try {
    const resp = await fetch(url, options);
    if (!resp.ok) {
      console.error('Fetch failed', url, resp.status, resp.statusText);
      return null;
    }
    return await resp.json();
  } catch (e) {
    console.error('Network error fetching', url, e && e.message);
    return null;
  }
};

const getGroups = async () => {
  const resp = await safeJsonFetch("/auth/api/groups/insequence");
  return resp ? resp.data : [];
};

const getContactNumbersInGroup = async (group) => {
  let numbers = [];
  const resp = await safeJsonFetch(`/auth/api/group/${group}/contacts`);
  const contacts = resp ? resp.data : [];
  for (const contact of contacts) {
    numbers.push(contact.phone_number);
  }
  return numbers;
};

const getContacts = async () => {
  const resp = await safeJsonFetch("/auth/api/contacts?active=1&filtered=1");
  return resp ? resp.data : [];
};

const getSelectedGroups = (categories = false) => {
  let selectedGroups = [];
  const checkboxes = document.querySelectorAll("input[type=checkbox]:checked");
  if (categories) {
    for (const checkbox of checkboxes) {
      selectedGroups.push(checkbox.dataset.category);
    }
  } else {
    for (const checkbox of checkboxes) {
      selectedGroups.push(checkbox.value);
    }
  } 
  return selectedGroups;
};

const getSelectedGroupsCategories = () => {
  const groups = new Set(getSelectedGroups(true));
  let text = "";
  for (const group of groups) {
    text += "[" + group + "] ";
  }
  return text.trim();
};

const getSelectedIndividuals = () => {
  const selectedIndividuals = $("#fullsendIndividualRecipients")
  .select2("data")
  .map((x) => x.id);
  return selectedIndividuals;
};

const handleSwitch = async (e) => {
  handleMessagePreview();
  const switches = document.getElementsByClassName("recipientSwitch");
  const modalBody = document.getElementById("recipientModalBody");
  const viewListButton = document.getElementById("viewRecipientList");
  let atLeastOneContact = false;
  
  let switchList = [];
  for (const switchA of switches) {
    if (switchA.checked) {
      switchList.push(switchA.value);
    }
  }
  
  if (switchList.length > 0) {
    const contactResp = await safeJsonFetch(`/auth/api/groups/contacts?groups=${switchList.join(",")}`);
    const contactList = contactResp ? contactResp.data : [];
    
    if (contactList.length > 0) {
      modalBody.innerHTML = `<table class="table">
    <thead>
      <tr>
        <th scope="col">First</th>
        <th scope="col">Last</th>
        <th scope="col">Phone number</th>
      </tr></thead><tbody id="tableBody"></tbody></table>`;
      
      for (const contact of contactList) {
        document.getElementById(
          "tableBody"
        ).innerHTML += `<tr><td>${contact.first_name}</td><td>${contact.last_name}</td><td>${contact.phone_number}</td></tr>`;
      }
      
      atLeastOneContact = true;
      viewListButton.disabled = false;
    }
  }
  
  if (!atLeastOneContact) {
    modalBody.innerHTML = "None";
    viewListButton.disabled = true;
  }
};

const sendMessage = async () => {
  // Respect server-side sending flag exposed via APP_CONFIG
  if (window.APP_CONFIG && window.APP_CONFIG.sendingEnabled === false) {
    alert('Sending is disabled in this environment.');
    return -1;
  }
  let error = false;
  document.getElementById("noMessageError").style.display = "none";
  document.getElementById("noRecipientsError").style.display = "none";
  const groupCategories = getSelectedGroupsCategories();
  const inputMessage = document.getElementById("fullsendMessage").value;
  const message = (groupCategories != "") ? inputMessage + "\n" + groupCategories : inputMessage;
  if (/^\s*$/.test(message)) {
    document.getElementById("noMessageError").style.display = "block";
    error = true;
  }
  const selectedGroups = getSelectedGroups();
  const selectedIndividuals = getSelectedIndividuals();
  
  if (selectedGroups.length == 0 && selectedIndividuals.length == 0) {
    document.getElementById("noRecipientsError").style.display = "block";
    error = true;
  }
  if (error) return -1;
  
  
  
  document.getElementById("sendButton").disabled = true;
  document.getElementById("fullsendMessage").disabled = true;
  
  const result = await fetch("/auth/api/messages/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message,
      groups: selectedGroups,
      individuals: selectedIndividuals,
    }),
  });
  document.getElementById(
    "alert-placeholder"
  ).innerHTML = `<div class="alert alert-success alert-dismissible fade show" role="alert">
  Your message has been sent!
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`;
  
  document.getElementById("fullsendForm").reset();
  document.getElementById("fullsendMessage").disabled = false;
  $("#fullsendIndividualRecipients").val(null).trigger("change");
};

const handleMessagePreview = () => {
  const fsmText = document.getElementById("fullsendMessage").value.trim();
  
  // If sending is disabled by config, keep send button disabled
  if (window.APP_CONFIG && window.APP_CONFIG.sendingEnabled === false) {
    document.getElementById("sendButton").disabled = true;
  } else {
    if (fsmText != "") {
      document.getElementById("sendButton").disabled = false;
    } else {
      document.getElementById("sendButton").disabled = true;
    }
  }
  
  const selectedCategories = getSelectedGroupsCategories();
  document.getElementById("preview").innerHTML = (fsmText == "") ? "<span style=\"color:#888\">Your preview will appear here...</span>": fsmText + "<br>" + selectedCategories;
};

const pageOnLoadFunctions = async () => {
  const groups = await getGroups();
  const recipientSwitch = document.getElementById("recipientSwitch");
  
  for (const group of groups) {
    document.getElementById(
      "fullsendGroupRecipients"
    ).innerHTML += `<input class="form-check-input recipientSwitch" type="checkbox" role="switch" value=${group.id} data-category="${group.category}" id="recipientSwitch-${group.id}" onchange="handleSwitch();">
                            <label class="form-check-label" for="recipientSwitch-${group.id}">${group.name}</label><br>
                            `;
  }
  
  const contacts = await getContacts();
  
  for (const contact of contacts) {
    document.getElementById(
      "fullsendIndividualRecipients"
    ).innerHTML += `<option value=${contact.id}>${contact.first_name} ${contact.last_name}</option>`;
  }
  
  const recipientListModal = new bootstrap.Modal(
    document.getElementById("recipientListModal")
  );
  
  $("select").select2({
    theme: "bootstrap-5",
  });
  $("#form-select-sm").select2({
    theme: "bootstrap-5",
    dropdownParent: $("#form-select-sm").parent(),
  });
};
