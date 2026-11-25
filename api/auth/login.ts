import {
  ADMIN_OAUTH_STATE_COOKIE,
  adminBaseUrl,
  adminLogin,
  isAdminAuthConfigured,
  serializeCookie,
} from "../../src/lib/admin-auth";

export function GET(request: Request): Response {
  const login = adminLogin();
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!isAdminAuthConfigured() || !login || !clientId) {
    return Response.redirect(new URL("/admin?error=not-configured", request.url));
  }

  const state = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "base64url"
  );
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set(
    "redirect_uri",
    new URL("/api/auth/callback", adminBaseUrl()).toString()
  );
  authorizeUrl.searchParams.set("scope", "read:user");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("login", login);
  authorizeUrl.searchParams.set("allow_signup", "false");

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizeUrl.toString(),
      "Cache-Control": "no-store",
      "Set-Cookie": serializeCookie(
        ADMIN_OAUTH_STATE_COOKIE,
        state,
        request,
        600
      ),
    },
  });
}
