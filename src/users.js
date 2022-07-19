const { execQuery } = require("./db");

const USERS_GET = "SELECT first_name, last_name, username, admin from users";
const USER_GET =
  "SELECT first_name, last_name, username, admin from users where id = ?";

exports.getUsers = (pool) =>
  execQuery(pool, USERS_GET, null, (results) => {
    delete results["meta"];
    return results;
  });

exports.getUser = (pool, user) =>
  execQuery(pool, USER_GET, user, (results) => {
    delete ["meta"];
    return results;
  });
