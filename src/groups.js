const { execQuery } = require("./db");

const CONTACTS_IN_GROUP_GET =
  "SELECT * FROM `contacts` WHERE id in (SELECT contact_id FROM contacts_groups where group_id = ?)";

exports.getContactsInGroup = (pool, group) =>
  execQuery(pool, CONTACTS_IN_GROUP_GET, group, (results) => {
    delete ["meta"];
    return results;
  });
