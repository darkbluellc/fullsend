const { execQuery } = require("./db");

const GROUPS_GET = "SELECT * FROM groups";
const CONTACTS_IN_GROUP_GET =
  "SELECT * FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ?)";
const NUMBERS_IN_GROUP_GET =
  "SELECT phone_number FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ?)";

exports.getGroups = (pool) =>
  execQuery(pool, GROUPS_GET, null, (results) => {
    return results;
  });

exports.getContactsInGroup = (pool, group) =>
  execQuery(pool, CONTACTS_IN_GROUP_GET, group, (results) => {
    return results;
  });

exports.getNumbersinGroup = (pool, group) =>
  execQuery(pool, NUMBERS_IN_GROUP_GET, group, (results) => {
    return results;
  });
