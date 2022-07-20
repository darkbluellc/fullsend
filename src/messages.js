const { execQuery } = require("./db");
const twilio = require("twilio");

const groupsApi = require("./groups.js");

require("dotenv").config();

const TWILIO_FROM = process.env.TWILIO_FROM;

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_TOKEN
);

const MESSAGE_ADD =
  "INSERT INTO messages (`id`, `user_id`, `text`, `sent_at`) VALUES (null, ?, ?, NOW())";
const MESSAGE_GROUP_ADD = "INSERT INTO messages_groups VALUES (?, ?)";

exports.sendMessage = (pool, userId, text, groups) => {
  let numbers = [];
  execQuery(pool, MESSAGE_ADD, [userId, text], async (results) => {
    if (results) {
      for (const group of groups) {
        const groupResponse = await groupsApi.getNumbersinGroup(pool, group);
        for (const groupNumber of groupResponse.data) {
          const number = groupNumber.phone_number;
          numbers.push(number);
        }
        execQuery(
          pool,
          MESSAGE_GROUP_ADD,
          [Number(results.insertId), group],
          async (results) => {}
        );
      }
      for (const number of numbers) {
        client.messages
          .create({
            body: text,
            to: number,
            from: TWILIO_FROM,
          })
          .then((message) => console.info(message));
      }
    }
  });
  // Send twilio message
};
