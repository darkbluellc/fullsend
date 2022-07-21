const { execQuery } = require("./db");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const AUTHENTICATE = "SELECT id, password FROM users WHERE username = ?";
const SESSION_CREATE =
  "INSERT INTO sessions (`id`, `user_id`, `last_login`, `expiration`) VALUES (?, ?, NOW(), NOW() + INTERVAL 5 DAY)";
const SESSION_DESTROY = "DELETE FROM sessions WHERE `id` = ?";
const SESSION_UPDATE =
  "UPDATE sessions SET `expiration` = NOW() + INTERVAL 5 DAY WHERE `id` = ?";
const SESSION_GET = "SELECT * FROM sessions WHERE id = ?";

exports.getUsers = (pool, sessionId) => {
  return execQuery(pool, SESSION_GET, sessionId, (results) => {
    return results;
  });
};

exports.login = async (pool, username, password) => {
  return execQuery(pool, AUTHENTICATE, username, async (results) => {
    if (results[0]) {
      const id = results[0].id;
      const saved_hash = results[0].password;
      const matches = bcrypt.compareSync(password, saved_hash);
      if (matches) {
        const session_id = crypto.randomBytes(20).toString("hex");
        const session_results = await execQuery(pool, SESSION_CREATE, [
          session_id,
          id,
        ]);
        return session_results.success ? session_id : undefined;
      }
    } else {
      return undefined;
    }
  });
};

exports.sessionUpdate = async (pool, sessionId) => {
  return execQuery(pool, SESSION_UPDATE, sessionId, async (results) => {
    return results;
  });
};

exports.logout = async (pool, sessionId) => {
  return execQuery(pool, SESSION_DESTROY, sessionId, async (results) => {
    return results;
  });
};

exports.getSession = (pool, sessionId) => {
  return execQuery(pool, SESSION_GET, sessionId, (results) => {
    return results;
  });
};
