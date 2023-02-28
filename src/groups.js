const { execQuery } = require("./db");

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
const ADD_CONTACT_TO_GROUP =
  "INSERT INTO contacts_groups (contact_id, group_id, enabled) VALUES (?, ?, 1)";
const REMOVE_CONTACT_FROM_GROUP =
  "DELETE FROM contacts_groups WHERE contact_id = ? AND group_id = ?";

exports.getGroups = async (pool) => execQuery(pool, GROUPS_GET, null);

exports.getGroupsInSequence = async (pool) =>
  execQuery(pool, GROUPS_SEQ_ACTIVE_GET, null);

exports.getContactsInGroup = async (pool, group) =>
  execQuery(pool, CONTACTS_IN_GROUP_GET, group);

exports.getContactsInMultipleGroups = async (pool, groups) => {
  groupsArr = groups.split(",");

  return await execQuery(
    pool,
    CONTACTS_IN_MULTIPLE_GROUPS_GET_A +
      groupsArr.map(() => "?").join(",") +
      CONTACTS_IN_MULTIPLE_GROUPS_GET_B,
    groupsArr.map((x) => parseInt(x))
  );
};

exports.getNumbersinGroup = async (pool, group) =>
  execQuery(pool, NUMBERS_IN_GROUP_GET, group);

exports.addContactToGroup = async (pool, contactId, group) =>
  execQuery(pool, ADD_CONTACT_TO_GROUP, [contactId, group]);

exports.removeContactFromGroup = async (pool, contactId, group) =>
  execQuery(pool, REMOVE_CONTACT_FROM_GROUP, [contactId, group]);
