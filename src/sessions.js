// Sessions are now managed by Keycloak OIDC. Keep compatibility exports
// so other modules that import `sessions` won't immediately break.

exports.getSession = async () => {
  // Not applicable: session information is carried in the Keycloak grant on req.kauth
  return { success: false, error: "Use Keycloak sessions via req.kauth" };
};

exports.login = async () => {
  // Local login is deprecated. Use Keycloak login flow.
  return { success: false, error: "Use Keycloak OIDC login" };
};

exports.logout = async () => {
  // Keycloak logout will be handled via Keycloak endpoint and middleware
  return { success: false, error: "Use Keycloak logout endpoint" };
};

exports.sessionUpdate = async () => {
  // No-op under Keycloak
  return { success: false, error: "Session updates handled by Keycloak" };
};
