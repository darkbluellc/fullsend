const { execQuery } = require("./db");

const CONTACTS_GET = "SELECT * FROM contacts";

exports.getContacts = (pool) =>
  execQuery(pool, CONTACTS_GET, null, (results) => {
    return results;
  });
