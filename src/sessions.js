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

exports.login = async (pool, username, password) =>
  execQuery(pool, AUTHENTICATE, username, (results) => {
    delete results["meta"];
    const id = results[0].id;
    const saved_hash = results[0].password;
    bcrypt.compare(password, saved_hash, (err, res) => {
      if (res) {
        const session_id = crypto.randomBytes(20).toString("hex");
        const results = await execQuery(pool, SESSION_CREATE, [session_id, id]);
        return results;
      }
    });
  });

exports.getSession = (pool, session) =>
  execQuery(pool, SESSION_GET, session, (results) => {
    delete results["meta"];
    return results;
  });
