const { execQuery } = require("./db");

const CONTACTS_GET = "SELECT * FROM contacts ORDER BY last_name";

exports.getContacts = (pool) => execQuery(pool, CONTACTS_GET, null);
