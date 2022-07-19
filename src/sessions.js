const { execQuery } = require("./db");
const bcrypt = require("bcrypt");

const SESSION_GET = "SELECT * FROM sessions WHERE session_id = ?";
const AUTHENTICATE = "SELECT password FROM users WHERE username = ?";

exports.getUsers = (pool, sessionId) =>
  execQuery(pool, SESSION_GET, sessionId, (results) => {
    delete results["meta"];
    return results;
  });

exports.login = (pool, username, password) =>
  execQuery(pool, AUTHENTICATE, username, (saved_hash) => {
    bcrypt.compare(password, saved_hash, (err, res) => {
      if (res == true) console.log("logged in successfully");
    });
  });
