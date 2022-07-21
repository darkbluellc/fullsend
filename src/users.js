const { execQuery } = require("./db");
const bcrypt = require("bcrypt");

const USERS_GET =
  "SELECT id, first_name, last_name, username, title, admin FROM users";
const USER_GET =
  "SELECT first_name, last_name, username, admin FROM users WHERE id = ?";
const PASSWORD_UPDATE = "UPDATE users SET password = ? WHERE id = ?";

exports.getUsers = (pool) =>
  execQuery(pool, USERS_GET, null, (results) => {
    return results;
  });

exports.getUser = (pool, user) =>
  execQuery(pool, USER_GET, user, (results) => {
    return results;
  });

exports.changePassword = (pool, user, plaintextPassword) => {
  const hashedPassword = bcrypt.hashSync(plaintextPassword, 10);
  execQuery(pool, PASSWORD_UPDATE, [hashedPassword, user], (results) => {
    return results;
  });
};
