const { execQuery } = require("./db");

const MESSAGE_ADD =
  "INSERT INTO messages (`id`, `user_id`, `text`, `sent_at`) VALUES (``, ?, ?, NOW())";
const MESSAGE_GROUP_ADD = "INSERT INTO messages_groups";

exports.sendMessage = (pool, userId, text, groups) => {
  execQuery(pool, MESSAGE_ADD, (userId, text));
  for (group in groups) {
  }
};
