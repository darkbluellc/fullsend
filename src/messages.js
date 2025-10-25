const { execQuery } = require("./db");
const twilio = require("twilio");

const groupsApi = require("./groups.js");
const usersApi = require("./users.js");
const contactsApi = require("./contacts.js");

require("dotenv").config();

const TWILIO_FROM = process.env.TWILIO_FROM;
const TWILIO_SID = process.env.TWILIO_SID;
const SENDING_ENABLED = process.env.SENDING_ENABLED == "true" ? true : false;

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_TOKEN
);

const MESSAGE_ADD =
"INSERT INTO messages (`id`, `user_id`, `text`, `sent_at`) VALUES (null, ?, ?, NOW())";
const MESSAGE_GROUP_ADD = "INSERT INTO messages_groups VALUES (?, ?)";
const MESSAGE_CONTACT_ADD = "INSERT INTO messages_contacts VALUES (?, ?)";

exports.sendMessage = async (pool, userId, text, groups, individuals) => {
  const numbers = new Set();
  const cleanText = text.replace(/ +/g, " ").replace(/\n+/g, "\n");
  const messageAdded = await execQuery(pool, MESSAGE_ADD, [userId, cleanText]);
  if (!messageAdded?.data?.insertId) {
    return;
  }
  for (const group of groups) {
    const groupResponse = await groupsApi.getNumbersinGroup(pool, group);
    for (const groupNumber of groupResponse.data) {
      const number = groupNumber.phone_number;
      numbers.add(number);
    }
    await execQuery(pool, MESSAGE_GROUP_ADD, [
      messageAdded.data.insertId,
      group,
    ]);
  }
  
  for (const id of individuals) {
    const number = (await contactsApi.getContactPhone(pool, id)).data[0]
    .phone_number;
    numbers.add(number);
    await execQuery(pool, MESSAGE_CONTACT_ADD, [
      messageAdded.data.insertId,
      id,
    ]);
  }
  
  let binding = [];
  
  const userPhoneNumber = await usersApi.getUserPhoneNumber(pool, userId);
  
  if (userPhoneNumber) numbers.add(userPhoneNumber);
  
  for (const number of numbers) {
    binding.push(JSON.stringify({ binding_type: "sms", address: number }));
  }
  
  if (SENDING_ENABLED) {
    try {
      for (const number of numbers) {
        await client.messages.create({
          from: TWILIO_FROM,
          to: number,
          body: cleanText
        });
      }
    } catch (err) {
      console.error(err);
    }
  } else {
    console.log("Sending disabled...");
    for (const number of numbers) {
      console.log(`to: ${number}`);
    }
    console.log(`body: ${cleanText}`);
  }
};
