const { execQuery } = require("./db");

const USERS_GET = "SELECT first_name, last_name, username, admin FROM users";
const USER_GET =
  "SELECT first_name, last_name, username, admin FROM users WHERE id = ?";

exports.getUsers = (pool) =>
  execQuery(pool, USERS_GET, null, (results) => {
    return results;
  });

exports.getUser = (pool, user) =>
  execQuery(pool, USER_GET, user, (results) => {
    return results;
  });
