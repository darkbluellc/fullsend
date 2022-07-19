const express = require("express");
const app = express();
const path = require("path");
const mariadb = require("mariadb");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const server = require("http").Server(app);

const carriers = require("./src/carriers.js");
const contacts = require("./src/contacts.js");
const groups = require("./src/groups.js");
const titles = require("./src/titles.js");
const users = require("./src/users.js");
const sessions = require("./src/sessions.js");
const messages = require("./src/messages.js");

const { version } = require("./package.json");

require("dotenv").config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 10,
});

// Initialize express app
const PORT = process.env.PORT || 8080;

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/api", async (req, res) => {
  res.send(`fullsend server is online<br>v${version}`);
});

app.get("/api/carriers", async (req, res) => {
  const response_data = await carriers.getCarriers(pool);
  res.send(response_data);
});

app.get("/api/contacts", async (req, res) => {
  const response_data = await contacts.getContacts(pool);
  res.send(response_data);
});

app.get("/api/groups", async (req, res) => {
  const response_data = await groups.getGroups(pool);
  res.send(response_data);
});

app.get(
  "/api/group/:group/contacts",
  async ({ params: { group: group } }, res) => {
    const response_data = await groups.getContactsInGroup(pool, group);
    res.send(response_data);
  }
);

app.get("/api/titles", async (req, res) => {
  const response_data = await titles.getTitles(pool);
  res.send(response_data);
});

app.get("/api/users", async (req, res) => {
  const response_data = await users.getUsers(pool);
  res.send(response_data);
});

app.get("/api/user/:user", async ({ params: { user: user } }, res) => {
  const response_data = await users.getUser(pool, user);
  res.send(response_data);
});

app.get(
  "/api/session/:session",
  async ({ params: { session: session } }, res) => {
    const response_data = await sessions.getSession(pool, session);
    res.send(response_data);
  }
);

app.post("/login", async (req, res) => {
  const response_data = await sessions.login(
    pool,
    req.body.username,
    req.body.password
  );
  res.send(response_data);
});

app.post("/api/sendmessage", async (req, res) => {
  const response_data = await messages.sendMessage(pool, req.body.message);
  res.send(response_data);
});

server.listen(PORT, () => {
  console.log("Fullsend is up!");
});
