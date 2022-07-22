const { execQuery } = require("./db");
const twilio = require("twilio");

const groupsApi = require("./groups.js");

require("dotenv").config();

const TWILIO_FROM = process.env.TWILIO_FROM;
const SENDING_ENABLED = process.env.SENDING_ENABLED == "true" ? true : false;

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_TOKEN
);

const MESSAGE_ADD =
  "INSERT INTO messages (`id`, `user_id`, `text`, `sent_at`) VALUES (null, ?, ?, NOW())";
const MESSAGE_GROUP_ADD = "INSERT INTO messages_groups VALUES (?, ?)";

exports.sendMessage = async (pool, userId, text, groups) => {
  const numbers = new Set();
  const messageAdded = await execQuery(pool, MESSAGE_ADD, [userId, text]);
  if (!messageAdded?.data?.insertId) {
    return;
  }
  for (const group of groups) {
    const groupResponse = await groupsApi.getNumbersinGroup(pool, group);
    for (const groupNumber of groupResponse.data) {
      const number = groupNumber.phone_number;
      numbers.add(number);
    }
    await execQuery(
      pool,
      MESSAGE_GROUP_ADD,
      [messageAdded.data.insertId, group],
    );
  }

  for (const number of numbers) {
    if (SENDING_ENABLED) {
      try {
        await client.messages.create(
          {
            body: text,
            to: number,
            from: TWILIO_FROM,
          }
        );
      } catch (err) {
        console.error(err);
      }
    } else {
      console.log(
        `Sending disabled...\nTo: ${number}\nFrom: ${TWILIO_FROM}\nText: ${text}\n`
      );
    }
  }
};