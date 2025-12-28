const { execQuery } = require("./db");
const bcrypt = require("bcryptjs");

const USERS_GET =
  "SELECT id, first_name, last_name, username, title, admin FROM users ORDER BY last_name";
const USER_GET =
  "SELECT first_name, last_name, username, admin FROM users WHERE id = ?";
const USER_GET_BY_USERNAME =
  "SELECT id, first_name, last_name, username, admin FROM users WHERE username = ?";
const USER_ID_PHONE_GET = "SELECT phone_number FROM contacts WHERE user_id = ?";
const PASSWORD_UPDATE = "UPDATE users SET password = ? WHERE id = ?";
const USER_CREATE = "INSERT INTO users (first_name, last_name, username, password, admin) VALUES (?, ?, ?, ?, 0)";

exports.getUsers = async (pool) => execQuery(pool, USERS_GET, null);

exports.getUser = async (pool, user) => execQuery(pool, USER_GET, user);

exports.getUserByUsername = async (pool, username) =>
  execQuery(pool, USER_GET_BY_USERNAME, username);

exports.getUserPhoneNumber = async (pool, user) => {
  const result = await execQuery(pool, USER_ID_PHONE_GET, user);
  if (result.data[0]) {
    return result.data[0].phone_number;
  } else {
    return undefined;
  }
};

exports.changePassword = async (pool, user, plaintextPassword) => {
  const hashedPassword = bcrypt.hashSync(plaintextPassword, 10);
  return await execQuery(pool, PASSWORD_UPDATE, [hashedPassword, user]);
};

// Creates a local user record from OIDC claims if the username does not already exist.
exports.addUserIfNotExists = async (pool, claims) => {
  if (!claims) return { success: false, error: 'No claims' };
  const username = claims.preferred_username || claims.username || (claims.email ? claims.email.split('@')[0] : undefined);
  if (!username) return { success: false, error: 'No username claim' };

  // Check if user already exists
  const existing = await exports.getUserByUsername(pool, username);
  if (existing && existing.data && existing.data[0]) {
    return { success: true, user: existing.data[0] };
  }

  // Build name fields from claims
  const firstName = claims.given_name || (claims.name ? claims.name.split(' ')[0] : '');
  const lastName = claims.family_name || (claims.name ? claims.name.split(' ').slice(1).join(' ') : '');

  // Create a random password hash since authentication is via Keycloak
  const randomPassword = Math.random().toString(36) + Date.now().toString(36);
  const hashedPassword = bcrypt.hashSync(randomPassword, 10);

  const createResp = await execQuery(pool, USER_CREATE, [firstName || '', lastName || '', username, hashedPassword]);
  if (createResp && createResp.success) {
    // Return the inserted user record (fetch by username to include id)
    const newUser = await exports.getUserByUsername(pool, username);
    return { success: true, user: newUser.data && newUser.data[0] };
  }
  return { success: false };
};
