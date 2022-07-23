const { execQuery } = require("./db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const AUTHENTICATE = "SELECT id, password FROM users WHERE username = ?";
const SESSION_CREATE =
  "INSERT INTO sessions (`id`, `user_id`, `last_login`, `expiration`) VALUES (?, ?, NOW(), NOW() + INTERVAL 5 DAY)";
const SESSION_DESTROY = "DELETE FROM sessions WHERE `id` = ?";
const SESSION_UPDATE =
  "UPDATE sessions SET `expiration` = NOW() + INTERVAL 5 DAY WHERE `id` = ?";
const SESSION_GET = "SELECT * FROM sessions WHERE id = ?";

exports.getUsers = async (pool, sessionId) => {
  return execQuery(pool, SESSION_GET, sessionId);
};

exports.login = async (pool, username, password) => {
  const authedUser = await execQuery(pool, AUTHENTICATE, username);
  if (authedUser.data[0]) {
    const id = authedUser.data[0].id;
    const saved_hash = authedUser.data[0].password;
    const matches = bcrypt.compareSync(password, saved_hash);
    if (matches) {
      const session_id = crypto.randomBytes(20).toString("hex");
      const session_results = await execQuery(pool, SESSION_CREATE, [
        session_id,
        id,
      ]);
      return session_results.success ? session_id : undefined;
    }
  }
  return undefined;
};

exports.sessionUpdate = async (pool, sessionId) => {
  return execQuery(pool, SESSION_UPDATE, sessionId);
};

exports.logout = async (pool, sessionId) => {
  return execQuery(pool, SESSION_DESTROY, sessionId);
};

exports.getSession = (pool, sessionId) => {
  return execQuery(pool, SESSION_GET, sessionId);
};
