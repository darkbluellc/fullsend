const { execQuery } = require("./db");

const CONTACTS_IN_GROUP_GET =
  "SELECT * FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ?)";
const NUMBERS_IN_GROUP_GET =
  "SELECT phone_number FROM contacts WHERE id IN (SELECT contact_id FROM contacts_groups WHERE group_id = ?)";

exports.getContactsInGroup = (pool, group) =>
  execQuery(pool, CONTACTS_IN_GROUP_GET, group, (results) => {
    return results;
  });

exports.getNumbersinGroup = (pool, group) =>
  execQuery(pool, NUMBERS_IN_GROUP_GET, group, (results) => {
    return results;
  });
