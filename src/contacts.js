const { execQuery } = require("./db");

const CONTACTS_GET = "SELECT * FROM contacts ORDER BY last_name";

const CONTACTS_ACTIVE_GET =
  "SELECT * FROM contacts WHERE enabled = 1 ORDER BY last_name";

const CONTACTS_ACTIVE_GET_FILTERED =
  "SELECT id, first_name, last_name, phone_number FROM contacts WHERE enabled = 1 ORDER BY last_name";

const CONTACT_PHONE_GET = "SELECT phone_number FROM contacts WHERE id = ?";

exports.getContacts = (pool) => execQuery(pool, CONTACTS_GET, null);
exports.getContactPhone = (pool, id) => execQuery(pool, CONTACT_PHONE_GET, id);
exports.getActiveContacts = (pool) =>
  execQuery(pool, CONTACTS_ACTIVE_GET, null);
exports.getFilteredActiveContacts = (pool) =>
  execQuery(pool, CONTACTS_ACTIVE_GET_FILTERED, null);
