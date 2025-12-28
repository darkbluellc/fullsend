const { Issuer, generators } = require("openid-client");
const { createRemoteJWKSet, jwtVerify } = require("jose");

let oidc = null;
let client = null;

async function initOidc() {
  if (oidc) return oidc;
  const issuerUrl = process.env.KEYCLOAK_ISSUER || process.env.KEYCLOAK_URL;
  if (!issuerUrl) throw new Error("KEYCLOAK_ISSUER or KEYCLOAK_URL must be set (example: https://auth.example.com/realms/realmname)");

  const issuer = await Issuer.discover(issuerUrl);
  oidc = {
    issuerUrl: issuer.issuer,
    jwksUri: issuer.metadata.jwks_uri,
    issuerObj: issuer,
  };
  return oidc;
}

async function initClient() {
  if (client) return client;
  const oidcCfg = await initOidc();
  const issuer = oidcCfg.issuerObj;
  const clientId = process.env.KEYCLOAK_CLIENT;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
  const redirectUri = process.env.KEYCLOAK_REDIRECT_URI || "http://localhost:8080/api/callback";

  if (!clientId) throw new Error("KEYCLOAK_CLIENT must be set for Authorization Code flow");

  client = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
  });

  return client;
}

async function getAuthorizationUrl(req) {
  const oidcClient = await initClient();
  const redirectUri = process.env.KEYCLOAK_REDIRECT_URI || "http://localhost:8080/api/callback";

  const codeVerifier = generators.codeVerifier();
  const codeChallenge = await generators.codeChallenge(codeVerifier);
  const state = generators.random();

  // store verifier+state in session
  if (!req.session) throw new Error("Session middleware required for login flow");
  req.session.code_verifier = codeVerifier;
  req.session.state = state;

  const url = oidcClient.authorizationUrl({
    scope: "openid profile email",
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return url;
}

async function handleCallback(req) {
  const oidcClient = await initClient();
  const redirectUri = process.env.KEYCLOAK_REDIRECT_URI || "http://localhost:8080/api/callback";
  if (!req.session) throw new Error("Session middleware required for callback");
  const params = oidcClient.callbackParams(req);
  const codeVerifier = req.session.code_verifier;
  const state = req.session.state;
  const tokenSet = await oidcClient.callback(redirectUri, params, { code_verifier: codeVerifier, state });

  // store tokenSet and claims in session
  req.session.tokenSet = tokenSet;
  req.session.claims = tokenSet.claims();

  // Also verify / decode the access token to capture roles (Keycloak typically puts roles in the access token)
  try {
    const oidcCfg = await initOidc();
    const JWKS = createRemoteJWKSet(new URL(oidcCfg.jwksUri));
    const verifyOpts = { issuer: oidcCfg.issuerUrl };
    if (process.env.KEYCLOAK_CLIENT) verifyOpts.audience = process.env.KEYCLOAK_CLIENT;
    const accessToken = tokenSet.access_token;
    if (accessToken) {
      const { payload } = await jwtVerify(accessToken, JWKS, verifyOpts);
      req.session.accessClaims = payload;
    }
  } catch (e) {
    // Fallback: don't block login if access token verification fails; try to decode without verification
    try {
      const { decodeJwt } = require('jose');
      if (tokenSet && tokenSet.access_token) {
        req.session.accessClaims = decodeJwt(tokenSet.access_token);
      }
    } catch (e2) {
      console.warn('access token decode failed', e2 && e2.message);
    }
  }
  return tokenSet;
}

function getLogoutUrl(req) {
  if (!oidc) return null;
  const endSession = oidc.issuerObj.metadata.end_session_endpoint;
  if (!endSession) return null;
  const postLogout = process.env.KEYCLOAK_POST_LOGOUT_REDIRECT || "http://localhost:8080/";
  const idToken = req.session && req.session.tokenSet && req.session.tokenSet.id_token;
  const url = new URL(endSession);
  if (idToken) url.searchParams.set('id_token_hint', idToken);
  url.searchParams.set('post_logout_redirect_uri', postLogout);
  return url.toString();
}

// Middleware: prefer session token, otherwise Authorization Bearer header
async function isLoggedIn(req, res, next) {
  try {
    // If there's a token in session (server-side flow), use its claims
    if (req.session && req.session.tokenSet) {
      const oidcClient = await initClient();
      const accessToken = req.session.tokenSet.access_token;
      // Prefer the already-decoded accessClaims stored at login
      let accessClaims = req.session.accessClaims || {};

      // Try to verify the access token via JWKS (fast, no client secret required)
      try {
        const oidcCfg = await initOidc();
        const JWKS = createRemoteJWKSet(new URL(oidcCfg.jwksUri));
        const verifyOpts = { issuer: oidcCfg.issuerUrl };
        if (process.env.KEYCLOAK_CLIENT) verifyOpts.audience = process.env.KEYCLOAK_CLIENT;
        if (accessToken) {
          const { payload } = await jwtVerify(accessToken, JWKS, verifyOpts);
          accessClaims = payload || accessClaims;
        }
      } catch (e) {
        // If jwt verification fails, don't immediately destroy session.
        // If introspection is available (and client secret configured), use it to check active status.
        try {
          if (process.env.KEYCLOAK_CLIENT_SECRET && typeof oidcClient.introspect === 'function') {
            const introspectResp = await oidcClient.introspect(accessToken);
            if (!introspectResp || introspectResp.active !== true) {
              try { req.session.destroy(() => {}); } catch (e2) {}
              return res.status(401).send({ code: 401, error: 'Unauthorized' });
            }
          } else {
            // As a last resort, try userinfo but do not destroy session if it fails; fall back to stored claims
            try {
              const userinfo = await oidcClient.userinfo(accessToken);
              if (userinfo) accessClaims = userinfo;
            } catch (e2) {
              // ignore; we'll use whatever we have in session
            }
          }
        } catch (e2) {
          // ignore and continue with stored claims
        }
      }

      // normalize sessionInfo to include access token claims (so downstream checks are uniform)
      const idClaims = req.session.claims || (req.session.tokenSet.claims && req.session.tokenSet.claims());
      req.body.sessionInfo = {
        token: accessToken,
        user_id: idClaims && idClaims.sub,
        username: (idClaims && (idClaims.preferred_username || idClaims.username)),
        email: idClaims && idClaims.email,
        realm_access: accessClaims && accessClaims.realm_access,
        resource_access: accessClaims && accessClaims.resource_access,
        // expose the access token claims directly for easier checks
        claims: accessClaims || {},
      };

      // Enforce fullsend_access role for all users
      const requiredRole = process.env.KEYCLOAK_FULLSEND_ROLE || 'fullsend_access';
      const hasRealm = (req.body.sessionInfo.realm_access && req.body.sessionInfo.realm_access.roles && req.body.sessionInfo.realm_access.roles.includes(requiredRole));
      const hasResource = req.body.sessionInfo.resource_access && Object.values(req.body.sessionInfo.resource_access).some(r => r && r.roles && r.roles.includes(requiredRole));
      if (!hasRealm && !hasResource) {
        return res.status(403).send({ code: 403, error: `Forbidden - missing required role: ${requiredRole}` });
      }

      return next();
    }

    // otherwise fallback to Authorization header verification
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) return res.status(401).send({ code: 401, error: "Unauthorized" });
    const match = String(authHeader).match(/Bearer (.+)/i);
    if (!match) return res.status(401).send({ code: 401, error: "Unauthorized" });
    const token = match[1];

    const oidcCfg = await initOidc();
    const JWKS = createRemoteJWKSet(new URL(oidcCfg.jwksUri));

    const verifyOpts = {
      issuer: oidcCfg.issuerUrl,
    };
    if (process.env.KEYCLOAK_CLIENT) verifyOpts.audience = process.env.KEYCLOAK_CLIENT;

    const { payload } = await jwtVerify(token, JWKS, verifyOpts);
    req.body.sessionInfo = {
      token,
      user_id: payload.sub,
      username: payload.preferred_username || payload.username,
      email: payload.email,
      realm_access: payload.realm_access,
      resource_access: payload.resource_access,
      claims: payload,
    };

    // Enforce fullsend_access role for bearer tokens as well
    const requiredRole = process.env.KEYCLOAK_FULLSEND_ROLE || 'fullsend_access';
    const hasRealm = (payload.realm_access && payload.realm_access.roles && payload.realm_access.roles.includes(requiredRole));
    const hasResource = payload.resource_access && Object.values(payload.resource_access).some(r => r && r.roles && r.roles.includes(requiredRole));
    if (!hasRealm && !hasResource) {
      return res.status(403).send({ code: 403, error: `Forbidden - missing required role: ${requiredRole}` });
    }
    return next();
  } catch (e) {
    console.error("isLoggedIn error", e && e.message);
    return res.status(401).send({ code: 401, error: "Unauthorized" });
  }
}

function isAdmin(req, res, next) {
  // sessionInfo.claims is normalized to access token claims in isLoggedIn
  const claims = req.body.sessionInfo && req.body.sessionInfo.claims;
  if (!claims) return res.status(403).send({ code: 403, error: "Forbidden" });

  const realmRoles = (claims.realm_access && claims.realm_access.roles) || [];
  const clientRoles = [];
  if (claims.resource_access) {
    // Try to extract roles from configured client first
    if (process.env.KEYCLOAK_CLIENT && claims.resource_access[process.env.KEYCLOAK_CLIENT]) {
      const ra = claims.resource_access[process.env.KEYCLOAK_CLIENT];
      if (ra && ra.roles) clientRoles.push(...ra.roles);
    } else {
      // otherwise flatten all client roles
      for (const k of Object.keys(claims.resource_access)) {
        const ra = claims.resource_access[k];
        if (ra && ra.roles) clientRoles.push(...ra.roles);
      }
    }
  }

  const roles = [...realmRoles, ...clientRoles];
  const adminRole = (req.body.sessionInfo && req.body.sessionInfo.adminRole) || process.env.KEYCLOAK_ADMIN_ROLE || "admin";
  if (roles.includes(adminRole)) return next();

  return res.status(403).send({ code: 403, error: "Forbidden" });
}

module.exports = {
  initOidc,
  initClient,
  getAuthorizationUrl,
  handleCallback,
  getLogoutUrl,
  isLoggedIn,
  isAdmin,
};
