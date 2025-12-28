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
const auth = require("./src/auth.js");
const messages = require("./src/messages.js");

const { version } = require("./package.json");
const { response } = require("express");

require("dotenv").config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionLimit: 10,
});

// Initialize express app
const PORT = process.env.PORT || 8080;

// Initialize OIDC discovery (will be awaited before server starts)
// Note: initOidc is async; we'll call it before starting the server below.

const isLoggedIn = auth.isLoggedIn;

const isAdmin = async (req, res, next) => {
  // Map Keycloak username to local users table to check admin flag
  const username = req.body.sessionInfo && req.body.sessionInfo.username;
  if (!username) return res.status(403).send({ code: 403, error: "Forbidden" });

  const userInfoResp = await users.getUserByUsername(pool, username);
  const userInfo = userInfoResp.data && userInfoResp.data[0];
  if (userInfo && userInfo.admin == 1) {
    return next();
  }
  return res.status(403).send({ code: 403, error: "Forbidden" });
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

app.get("/privacy", (req, res) => {
  res.sendFile(path.join(__dirname, "public/privacy.html"));
});

app.get("/terms", (req, res) => {
  res.sendFile(path.join(__dirname, "public/terms.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

app.get("/fullsend", (req, res) => {
  res.sendFile(path.join(__dirname, "public/fullsend.html"));
});

app.get("/changepassword", (req, res) => {
  res.sendFile(path.join(__dirname, "public/changepassword.html"));
});

app.get("/group-management", (req, res) => {
  res.sendFile(path.join(__dirname, "public/group-management.html"));
});

app.get("/api", async (req, res) => {
  res.send(`fullsend server is online<br>v${version}`);
});

app.get("/api/version", async (req, res) => {
  res.send(`v${version}`);
});

authRouter.get("/api/carriers", async (req, res) => {
  const response_data = await carriers.getCarriers(pool);
  res.send(response_data);
});

authRouter.get("/api/contacts", async (req, res) => {
  let response_data;
  if (req.query.active == 1) {
    if (req.query.filtered == 1) {
      response_data = await contacts.getFilteredActiveContacts(pool);
    } else {
      response_data = await contacts.getActiveContacts(pool);
    }
  } else {
    response_data = await contacts.getContacts(pool);
  }
  res.send(response_data);
});

authRouter.get("/api/groups", async (req, res) => {
  const response_data = await groups.getGroups(pool);
  res.send(response_data);
});

authRouter.get("/api/groups/insequence", async (req, res) => {
  const response_data = await groups.getGroupsInSequence(pool);
  res.send(response_data);
});

authRouter.get(
  "/api/group/:group/contacts",
  async ({ params: { group: group } }, res) => {
    const response_data = await groups.getContactsInGroup(pool, group);
    res.send(response_data);
  }
);

authRouter.get("/api/groups/contacts", async (req, res) => {
  const response_data = await groups.getContactsInMultipleGroups(
    pool,
    req.query.groups
  );
  res.send(response_data);
});

authRouter.get("/api/users", async (req, res) => {
  const response_data = await users.getUsers(pool);
  res.send(response_data);
});

authRouter.get("/api/user/:user", async ({ params: { user: user } }, res) => {
  const response_data = await users.getUser(pool, user);
  res.send(response_data);
});

authRouter.get("/api/session/info", async (req, res) => {
  if (req.body.sessionInfo) {
    res.send({ success: true, data: req.body.sessionInfo });
  } else {
    res.status(404).send({ success: false, error: "No session info" });
  }
});

app.get('/api/login', (req, res) => {
  // Login handled by Keycloak. Frontend should redirect users to Keycloak login.
  res.send({ info: 'Login handled by Keycloak OIDC' });
});

app.get('/api/logout', (req, res) => {
  // Logout handled by Keycloak end-session endpoint; provide info to client
  res.send({ info: 'Logout via Keycloak end-session endpoint' });
});

authRouter.post("/api/users/update/password", isAdmin, async (req, res) => {
  const response_data = await users.changePassword(
    pool,
    req.body.userId,
    req.body.password
  );
  res.send(response_data);
});

authRouter.post("/api/groups/update/addcontact", isAdmin, async (req, res) => {
  const response_data = await groups.addContactToGroup(
    pool,
    req.body.contactId,
    req.body.groupId
  );
});

authRouter.post(
  "/api/groups/update/removecontact",
  isAdmin,
  async (req, res) => {
    const response_data = await groups.removeContactFromGroup(
      pool,
      req.body.contactId,
      req.body.groupId
    );
  }
);

authRouter.post("/api/messages/send", async (req, res) => {
  // Derive local user id from Keycloak username
  const username = req.body.sessionInfo && req.body.sessionInfo.username;
  let userId;
  if (username) {
    const userResp = await users.getUserByUsername(pool, username);
    if (userResp && userResp.data && userResp.data[0]) {
      userId = userResp.data[0].id;
    }
  }

  if (!userId) return res.status(403).send({ code: 403, error: "Forbidden" });

  const response_data = await messages.sendMessage(
    pool,
    userId,
    req.body.message,
    req.body.groups,
    req.body.individuals
  );
  res.send(response_data);
});

(async () => {
  try {
    await auth.initOidc();
    server.listen(PORT, () => {
      console.log("Fullsend is up!");
    });
  } catch (err) {
    console.error('Failed to initialize OIDC:', err && err.message);
    process.exit(1);
  }
})();
