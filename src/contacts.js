const { execQuery } = require("./db");

const CONTACTS_GET = "SELECT * FROM contacts ORDER BY last_name";

const CONTACTS_ACTIVE_GET =
  "SELECT * FROM contacts ORDER BY last_name WHERE active = 1";

exports.getContacts = (pool) => execQuery(pool, CONTACTS_GET, null);
exports.getActiveContacts = (pool) =>
  execQuery(pool, CONTACTS_ACTIVE_GET, null);
