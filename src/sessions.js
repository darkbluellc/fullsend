const { execQuery } = require("./db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const AUTHENTICATE = "SELECT id, password FROM users WHERE username = ?";
const SESSION_CREATE =
  "INSERT INTO sessions (`id`, `user_id`, `last_login`, `expiration`) VALUES (?, ?, NOW(), NOW() + INTERVAL 5 DAY);";
const SESSION_GET = "SELECT * FROM sessions WHERE id = ?";

exports.getUsers = (pool, sessionId) =>
  execQuery(pool, SESSION_GET, sessionId, (results) => {
    delete results["meta"];
    return results;
  });

exports.login = async (pool, username, password) => {
  execQuery(pool, AUTHENTICATE, username, async (results) => {
    delete results["meta"];
    const id = results[0].id;
    const saved_hash = results[0].password;
    bcrypt.compare(password, saved_hash, async (err, res) => {
      if (res) {
        console.log("res is true");
        const session_id = crypto.randomBytes(20).toString("hex");
        const session_results = await execQuery(pool, SESSION_CREATE, [
          session_id,
          id,
        ]);
        console.log(session_results);
        return session_results;
      }
    });
  });
};

exports.getSession = (pool, session) =>
  execQuery(pool, SESSION_GET, session, (results) => {
    delete results["meta"];
    return results;
  });
