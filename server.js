const express = require("express");
const app = express();
const path = require("path");
const mariadb = require("mariadb");
const bodyParser = require("body-parser");
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

const isLoggedIn = async (req, res, next) => {
  //"Checking session...
  if (req.headers.session) {
      //A session token was passed back, now checking if it is valid...
    const session = await sessions.getSession(pool, req.headers.session);
    if (session.data[0]) {
      // Valid session token found
      next();
    } else {
      // The token passed back is invalid
      res.send(401, "Unauthorized");
    }
  } else {
    // No session token passed back
    res.send(401, "Unauthorized");
  }
};

// auth router, anything on this router requires signin
const authRouter = express.Router();
authRouter.use(isLoggedIn);

// app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Note this makes authed apis becoeme /auth/api....
app.use("/auth", authRouter);

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/help", (req, res) => {
  res.sendFile(path.join(__dirname, "public/help.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/fullsend", (req, res) => {
  res.sendFile(path.join(__dirname, "public/fullsend.html"));
});

app.get("/api", async (req, res) => {
  res.send(`fullsend server is online<br>v${version}`);
});

authRouter.get("/api/carriers", async (req, res) => {
  const response_data = await carriers.getCarriers(pool);
  res.send(response_data);
});

authRouter.get("/api/contacts", async (req, res) => {
  const response_data = await contacts.getContacts(pool);
  res.send(response_data);
});

authRouter.get("/api/groups", async (req, res) => {
  const response_data = await groups.getGroups(pool);
  res.send(response_data);
});

authRouter.get(
  "/api/group/:group/contacts",
  async ({ params: { group: group } }, res) => {
    const response_data = await groups.getContactsInGroup(pool, group);
    res.send(response_data);
  }
);

authRouter.get("/api/titles", async (req, res) => {
  const response_data = await titles.getTitles(pool);
  res.send(response_data);
});

authRouter.get("/api/users", async (req, res) => {
  const response_data = await users.getUsers(pool);
  res.send(response_data);
});

authRouter.get(
  "/api/user/:user",
  async ({ params: { user: user } }, res) => {
    const response_data = await users.getUser(pool, user);
    res.send(response_data);
  }
);

authRouter.get(
  "/api/session/:session",
  async ({ params: { session: session } }, res) => {
    const response_data = await sessions.getSession(pool, session);
    res.send(response_data);
  }
);

app.post("/api/login", async (req, res) => {
  const sessionId = await sessions.login(
    pool,
    req.body.username,
    req.body.password
  );
  sessionId
    ? res.send({ session: sessionId })
    : res.status(403).send({ code: 403, error: "Invalid session" });
});

app.get("/api/logout", async (req, res) => {
  const response_data = await sessions.logout(pool, req.headers.session);
  if (response_data.success) {
    res.send(response_data);
  }
});

authRouter.post("/api/messages/send", async (req, res) => {
  const userId = await sessions.getSession(pool, req.headers.session);
  const response_data = await messages.sendMessage(
    pool,
    userId.data[0].user_id,
    req.body.message,
    req.body.groups
  );
  res.send(response_data);
});

server.listen(PORT, () => {
  console.log("Fullsend is up!");
});
