const { execQuery } = require("./db");

const SESSION_GET = "SELECT * FROM sessions where session_id = ?";

exports.getUsers = (pool, sessionId) =>
  execQuery(pool, SESSION_GET, sessionId, (results) => {
    delete results["meta"];
    return results;
  });
