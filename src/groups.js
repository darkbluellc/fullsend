const { execQuery } = require("./db");

// Sentinel id for the dynamic, admin-only "enabled senders" recipient group.
// This group is not stored in the `groups` table; its membership is computed
// from contacts that are linked to a user (a sender) and are enabled.
const SENDERS_GROUP_ID = "senders";

const GROUPS_GET = "SELECT * FROM groups";
const GROUPS_SEQ_ACTIVE_GET =
  "SELECT * FROM groups WHERE active = 1 ORDER BY sequence";
const CONTACTS_IN_GROUP_GET =
  "SELECT * FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ? AND enabled = 1) AND enabled = 1";

const CONTACTS_IN_MULTIPLE_GROUPS_GET_A =
  "SELECT * FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id IN (";
const CONTACTS_IN_MULTIPLE_GROUPS_GET_B =
  ") AND enabled = 1) AND enabled = 1 ORDER BY last_name";

const NUMBERS_IN_GROUP_GET =
  "SELECT phone_number FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ? AND enabled = 1) AND enabled = 1";

// Enabled senders: contacts tied to a user (a sender) that are enabled.
const CONTACTS_ENABLED_SENDERS_GET =
  "SELECT * FROM contacts WHERE user_id IS NOT NULL AND enabled = 1 ORDER BY last_name";
const NUMBERS_ENABLED_SENDERS_GET =
  "SELECT phone_number FROM contacts WHERE user_id IS NOT NULL AND enabled = 1";
const ADD_CONTACT_TO_GROUP =
  "INSERT INTO contacts_groups (contact_id, group_id, enabled) VALUES (?, ?, 1)";
const REMOVE_CONTACT_FROM_GROUP =
  "DELETE FROM contacts_groups WHERE contact_id = ? AND group_id = ?";

exports.SENDERS_GROUP_ID = SENDERS_GROUP_ID;

const isSendersGroup = (group) => String(group) === SENDERS_GROUP_ID;

exports.getGroups = async (pool) => execQuery(pool, GROUPS_GET, null);

exports.getGroupsInSequence = async (pool) =>
  execQuery(pool, GROUPS_SEQ_ACTIVE_GET, null);

exports.getEnabledSenders = async (pool) =>
  execQuery(pool, CONTACTS_ENABLED_SENDERS_GET, null);

exports.getEnabledSendersNumbers = async (pool) =>
  execQuery(pool, NUMBERS_ENABLED_SENDERS_GET, null);

exports.getContactsInGroup = async (pool, group) =>
  isSendersGroup(group)
    ? exports.getEnabledSenders(pool)
    : execQuery(pool, CONTACTS_IN_GROUP_GET, group);

exports.getContactsInMultipleGroups = async (pool, groups) => {
  const groupsArr = String(groups || "")
    .split(",")
    .filter((x) => x !== "");
  const includeSenders = groupsArr.includes(SENDERS_GROUP_ID);
  const numericGroups = groupsArr
    .filter((x) => x !== SENDERS_GROUP_ID)
    .map((x) => parseInt(x))
    .filter((x) => !Number.isNaN(x));

  // Dedupe by contact id so a sender who is also in a selected group appears once.
  const contactsById = new Map();

  if (numericGroups.length > 0) {
    const resp = await execQuery(
      pool,
      CONTACTS_IN_MULTIPLE_GROUPS_GET_A +
        numericGroups.map(() => "?").join(",") +
        CONTACTS_IN_MULTIPLE_GROUPS_GET_B,
      numericGroups
    );
    if (resp && resp.data) {
      for (const contact of resp.data) contactsById.set(contact.id, contact);
    }
  }

  if (includeSenders) {
    const sendersResp = await exports.getEnabledSenders(pool);
    if (sendersResp && sendersResp.data) {
      for (const contact of sendersResp.data) contactsById.set(contact.id, contact);
    }
  }

  const data = [...contactsById.values()].sort((a, b) =>
    String(a.last_name || "").localeCompare(String(b.last_name || ""))
  );
  return { success: true, data };
};

exports.getNumbersinGroup = async (pool, group) =>
  isSendersGroup(group)
    ? exports.getEnabledSendersNumbers(pool)
    : execQuery(pool, NUMBERS_IN_GROUP_GET, group);

exports.addContactToGroup = async (pool, contactId, group) =>
  execQuery(pool, ADD_CONTACT_TO_GROUP, [contactId, group]);

exports.removeContactFromGroup = async (pool, contactId, group) =>
  execQuery(pool, REMOVE_CONTACT_FROM_GROUP, [contactId, group]);
