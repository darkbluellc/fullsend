const { execQuery } = require("./db");

const CONTACTS_GET = "SELECT * FROM contacts ORDER BY last_name";

const CONTACTS_ACTIVE_GET =
  "SELECT * FROM contacts WHERE enabled = 1 ORDER BY last_name";

const CONTACTS_ACTIVE_GET_FILTERED =
  "SELECT id, first_name, last_name, phone_number FROM contacts WHERE enabled = 1 ORDER BY last_name";

exports.getContacts = (pool) => execQuery(pool, CONTACTS_GET, null);
exports.getActiveContacts = (pool) =>
  execQuery(pool, CONTACTS_ACTIVE_GET, null);
exports.getFilteredActiveContacts = (pool) =>
  execQuery(pool, CONTACTS_ACTIVE_GET_FILTERED, null);
