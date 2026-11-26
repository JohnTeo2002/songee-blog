import {
  ADMIN_SESSION_COOKIE,
  clearCookie,
  sameOrigin,
} from "../../src/lib/admin-auth.js";

export function POST(request: Request): Response {
  if (!sameOrigin(request)) {
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": clearCookie(ADMIN_SESSION_COOKIE, request),
      },
    }
  );
}
