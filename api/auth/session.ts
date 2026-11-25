import {
  ADMIN_SESSION_COOKIE,
  adminLogin,
  isAdminAuthConfigured,
  isPublishingConfigured,
  isValidAdminSession,
  readCookie,
} from "../../src/lib/admin-auth";

export async function GET(request: Request): Promise<Response> {
  const configured = isAdminAuthConfigured() && isPublishingConfigured();
  const authenticated =
    configured &&
    (await isValidAdminSession(readCookie(request, ADMIN_SESSION_COOKIE)));
  return Response.json(
    {
      configured,
      authenticated,
      ...(authenticated && { login: adminLogin() }),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
