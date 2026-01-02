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
const session = require('express-session');

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

// Session middleware (required for server-side login flow)
app.use(session({
  secret: process.env.SESSION_SECRET || 'a very long secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // set secure: true if using HTTPS
}));

// Initialize OIDC discovery (will be awaited before server starts)
// Note: initOidc is async; we'll call it before starting the server below.

const isLoggedIn = auth.isLoggedIn;

// Use Keycloak roles for admin checks. If you want to rely on local DB admin flag
// instead, change this to query users.getUserByUsername.
const isAdmin = auth.isAdmin;

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

app.get("/no-access", (req, res) => {
  res.sendFile(path.join(__dirname, "public/no-access.html"));
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
    const sessionInfo = req.body.sessionInfo;
    // Expose the configured admin role name to the client so browser-side checks
    // don't need to rely on Node-only process.env variables.
    sessionInfo.adminRole = process.env.KEYCLOAK_ADMIN_ROLE || 'admin';
    // Try to map to a local user record for convenience
    let localUser = null;
    try {
      if (sessionInfo.username) {
        const userResp = await users.getUserByUsername(pool, sessionInfo.username);
        if (userResp && userResp.data && userResp.data[0]) {
          localUser = userResp.data[0];
        }
      }
    } catch (e) {
      console.error('local user lookup failed', e && e.message);
    }
  // If we have a localUser stored in session (created during callback), prefer that
  const sessionLocalUser = req.session && req.session.localUser ? req.session.localUser : localUser;
  res.send({ success: true, data: { sessionInfo, localUser: sessionLocalUser } });
  } else {
    res.status(404).send({ success: false, error: "No session info" });
  }
});

app.get('/api/login', async (req, res) => {
  try {
    const url = await auth.getAuthorizationUrl(req);
    return res.redirect(url);
  } catch (err) {
    console.error('login redirect failed', err && err.message);
    return res.status(500).send({ error: 'Login redirect failed' });
  }
});

// Debug endpoint (no role enforcement) to inspect session info during development
app.get('/api/debug/session', async (req, res) => {
  try {
    if (req.session && req.session.tokenSet) {
      const sessionInfo = req.session.claims || (req.session.tokenSet.claims && req.session.tokenSet.claims());
      return res.send({ success: true, data: { sessionInfo, localUser: req.session.localUser || null } });
    }
    return res.status(404).send({ success: false, error: 'No session' });
  } catch (e) {
    console.error('debug session failed', e && e.message);
    return res.status(500).send({ success: false, error: 'Server error' });
  }
});

app.get('/api/callback', async (req, res) => {
  try {
    await auth.handleCallback(req);
    // Ensure a local user exists for the logged in Keycloak user
    try {
      const claims = req.session && req.session.claims;
      if (claims) {
        const addResp = await users.addUserIfNotExists(pool, claims);
        if (addResp && addResp.success && addResp.user) {
          // store local user on session for convenience
          req.session.localUser = addResp.user;
        }
      }
    } catch (e) {
      console.error('addUserIfNotExists failed', e && e.message);
    }

    // After login, ensure the user has the required Fullsend role. If not,
    // redirect to a friendly page explaining lack of access.
    try {
      const requiredRole = process.env.KEYCLOAK_FULLSEND_ROLE || 'fullsend_access';
      const accessClaims = req.session && req.session.accessClaims ? req.session.accessClaims : (req.session && req.session.claims ? req.session.claims : null);
      let hasRole = false;
      if (accessClaims) {
        const realmRoles = (accessClaims.realm_access && accessClaims.realm_access.roles) || [];
        if (realmRoles.includes(requiredRole)) hasRole = true;
        if (!hasRole && accessClaims.resource_access) {
          for (const k of Object.keys(accessClaims.resource_access)) {
            const ra = accessClaims.resource_access[k];
            if (ra && ra.roles && ra.roles.includes(requiredRole)) { hasRole = true; break; }
          }
        }
      }
      if (!hasRole) {
        return res.redirect('/no-access');
      }
    } catch (e) {
      console.error('post-login role check failed', e && e.message);
    }

    // Redirect to app home or post-login page
    return res.redirect('/fullsend');
  } catch (err) {
    console.error('callback handling failed', err && err.message);
    return res.status(500).send({ error: 'Callback processing failed' });
  }
});

app.get('/api/logout', (req, res) => {
  try {
    const logoutUrl = auth.getLogoutUrl(req);
    // destroy local session
    if (req.session) {
      req.session.destroy(() => {});
    }
    if (logoutUrl) return res.redirect(logoutUrl);
    return res.redirect('/');
  } catch (err) {
    console.error('logout failed', err && err.message);
    return res.status(500).send({ error: 'Logout failed' });
  }
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
