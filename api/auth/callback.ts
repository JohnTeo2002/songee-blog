import {
  ADMIN_OAUTH_STATE_COOKIE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE,
  adminBaseUrl,
  adminLogin,
  clearCookie,
  createAdminSession,
  isAdminAuthConfigured,
  readCookie,
  serializeCookie,
} from "../../src/lib/admin-auth";

function adminRedirect(error?: string): URL {
  const url = new URL("/admin", adminBaseUrl());
  if (error) url.searchParams.set("error", error);
  return url;
}

function redirectTo(url: URL, cookies: string[]): Response {
  const headers = new Headers({
    Location: url.toString(),
    "Cache-Control": "no-store",
  });
  for (const cookie of cookies) headers.append("Set-Cookie", cookie);
  return new Response(null, { status: 302, headers });
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const expiredStateCookie = clearCookie(ADMIN_OAUTH_STATE_COOKIE, request);
  const stateCookie = readCookie(request, ADMIN_OAUTH_STATE_COOKIE);
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  if (url.searchParams.has("error")) {
    return redirectTo(adminRedirect("sign-in-denied"), [expiredStateCookie]);
  }
  if (!isAdminAuthConfigured() || !stateCookie || state !== stateCookie || !code) {
    return redirectTo(adminRedirect("sign-in-failed"), [expiredStateCookie]);
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const allowedLogin = adminLogin();
  if (!clientId || !clientSecret || !allowedLogin) {
    return redirectTo(adminRedirect("not-configured"), [expiredStateCookie]);
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: new URL("/api/auth/callback", adminBaseUrl()).toString(),
          state,
        }),
      }
    );
  } catch {
    return redirectTo(adminRedirect("sign-in-failed"), [expiredStateCookie]);
  }

  let tokenResult: { access_token?: unknown };
  try {
    tokenResult = (await tokenResponse.json()) as {
      access_token?: unknown;
    };
  } catch {
    return redirectTo(adminRedirect("sign-in-failed"), [expiredStateCookie]);
  }
  if (!tokenResponse.ok || typeof tokenResult.access_token !== "string") {
    return redirectTo(adminRedirect("sign-in-failed"), [expiredStateCookie]);
  }

  let userResponse: Response;
  try {
    userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${tokenResult.access_token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "songee-blog-admin",
      },
    });
  } catch {
    return redirectTo(adminRedirect("sign-in-failed"), [expiredStateCookie]);
  }

  let user: { login?: unknown };
  try {
    user = (await userResponse.json()) as { login?: unknown };
  } catch {
    return redirectTo(adminRedirect("sign-in-failed"), [expiredStateCookie]);
  }
  if (
    !userResponse.ok ||
    typeof user.login !== "string" ||
    user.login.toLowerCase() !== allowedLogin.toLowerCase()
  ) {
    return redirectTo(adminRedirect("not-authorized"), [expiredStateCookie]);
  }

  const session = await createAdminSession(user.login);
  return redirectTo(adminRedirect(), [
    expiredStateCookie,
    serializeCookie(
      ADMIN_SESSION_COOKIE,
      session,
      request,
      ADMIN_SESSION_MAX_AGE
    ),
  ]);
}
