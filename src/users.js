const { execQuery } = require("./db");
const bcrypt = require("bcryptjs");

const USERS_GET =
  "SELECT id, first_name, last_name, username, title, admin FROM users ORDER BY last_name";
const USER_GET =
  "SELECT first_name, last_name, username, admin FROM users WHERE id = ?";
const USER_ID_PHONE_GET = "SELECT phone_number FROM contacts WHERE user_id = ?";
const PASSWORD_UPDATE = "UPDATE users SET password = ? WHERE id = ?";

exports.getUsers = async (pool) => execQuery(pool, USERS_GET, null);

exports.getUser = async (pool, user) => execQuery(pool, USER_GET, user);

exports.getUserIdPhone = async (pool, user) =>
  execQuery(pool, USER_ID_PHONE_GET, user);

exports.changePassword = async (pool, user, plaintextPassword) => {
  const hashedPassword = bcrypt.hashSync(plaintextPassword, 10);
  return await execQuery(pool, PASSWORD_UPDATE, [hashedPassword, user]);
};
