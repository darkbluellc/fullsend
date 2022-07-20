const { execQuery } = require("./db");

const MESSAGE_ADD =
  "INSERT INTO messages (`id`, `user_id`, `text`, `sent_at`) VALUES (null, ?, ?, NOW())";
const MESSAGE_GROUP_ADD = "INSERT INTO messages_groups VALUES (?, ?)";

exports.sendMessage = (pool, userId, text, groups) => {
  execQuery(pool, MESSAGE_ADD, [userId, text], async (results) => {
    if (results) {
      for (const group of groups) {
        execQuery(
          pool,
          MESSAGE_GROUP_ADD,
          [Number(results.insertId), group],
          async (results) => {}
        );
      }
    }
  });
  // Send twilio message
};
