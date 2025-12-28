const { Issuer } = require("openid-client");
const { createRemoteJWKSet, jwtVerify, decodeJwt } = require("jose");

let oidc = null;

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

// Middleware: look for Authorization: Bearer <token> header and verify using JWKS
async function isLoggedIn(req, res, next) {
  try {
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
    return next();
  } catch (e) {
    console.error("isLoggedIn error", e && e.message);
    return res.status(401).send({ code: 401, error: "Unauthorized" });
  }
}

function isAdmin(req, res, next) {
  const payload = req.body.sessionInfo && req.body.sessionInfo.claims;
  if (!payload) return res.status(403).send({ code: 403, error: "Forbidden" });

  const realmRoles = (payload.realm_access && payload.realm_access.roles) || [];
  const clientRoles = [];
  if (payload.resource_access && process.env.KEYCLOAK_CLIENT) {
    const ra = payload.resource_access[process.env.KEYCLOAK_CLIENT];
    if (ra && ra.roles) clientRoles.push(...ra.roles);
  }

  const roles = [...realmRoles, ...clientRoles];
  const adminRole = process.env.KEYCLOAK_ADMIN_ROLE || "admin";
  if (roles.includes(adminRole)) return next();

  return res.status(403).send({ code: 403, error: "Forbidden" });
}

module.exports = {
  initOidc,
  isLoggedIn,
  isAdmin,
};
