const { execQuery } = require("./db");

const GROUPS_GET = "SELECT * FROM groups";
const GROUPS_SEQ_ACTIVE_GET =
  "SELECT * FROM groups WHERE active = 1 ORDER BY sequence";
const CONTACTS_IN_GROUP_GET =
  "SELECT * FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ?)";
const NUMBERS_IN_GROUP_GET =
  "SELECT phone_number FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ?)";

exports.getGroups = async (pool) => execQuery(pool, GROUPS_GET, null);

exports.getGroupsInSequence = async (pool) =>
  execQuery(pool, GROUPS_SEQ_ACTIVE_GET, null);

exports.getContactsInGroup = async (pool, group) =>
  execQuery(pool, CONTACTS_IN_GROUP_GET, group);

exports.getNumbersinGroup = async (pool, group) =>
  execQuery(pool, NUMBERS_IN_GROUP_GET, group);
