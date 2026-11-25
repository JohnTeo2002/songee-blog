import { SITE_URL } from "../consts";

export const ADMIN_SESSION_COOKIE = "admin_session";
export const ADMIN_OAUTH_STATE_COOKIE = "admin_oauth_state";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

function base64UrlEncode(value: Uint8Array | string): string {
  return Buffer.from(value).toString("base64url");
}

function sessionSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function adminLogin(): string | null {
  return process.env.ADMIN_GITHUB_LOGIN?.trim() || null;
}

export function adminBaseUrl(): string {
  return process.env.ADMIN_BASE_URL || SITE_URL;
}

export function isAdminAuthConfigured(): boolean {
  return Boolean(
    adminLogin() &&
      sessionSecret() &&
      process.env.GITHUB_OAUTH_CLIENT_ID &&
      process.env.GITHUB_OAUTH_CLIENT_SECRET
  );
}

export function isPublishingConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_TOKEN &&
      process.env.GITHUB_REPOSITORY &&
      /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(
        process.env.GITHUB_REPOSITORY
      )
  );
}

export function readCookie(request: Request, name: string): string | undefined {
  return request.headers
    .get("cookie")
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function serializeCookie(
  name: string,
  value: string,
  request: Request,
  maxAge: number,
  sameSite: "lax" | "strict" = "lax"
): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=${value}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=${sameSite}${secure}`;
}

export function clearCookie(name: string, request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${name}=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export async function createAdminSession(login: string): Promise<string> {
  const secret = sessionSecret();
  if (!secret) throw new Error("Admin session signing is not configured.");

  const payload = base64UrlEncode(
    JSON.stringify({
      login,
      expiresAt: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
    })
  );
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return `${payload}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function isValidAdminSession(
  token: string | undefined
): Promise<boolean> {
  const secret = sessionSecret();
  const allowedLogin = adminLogin();
  if (!token || !secret || !allowedLogin) return false;

  const [payload, signature, extra] = token.split(".");
  if (
    !payload ||
    !signature ||
    extra !== undefined ||
    !/^[A-Za-z0-9_-]+$/.test(payload) ||
    !/^[A-Za-z0-9_-]+$/.test(signature)
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const validSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(signature, "base64url"),
    encoder.encode(payload)
  );
  if (!validSignature) return false;

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as { login?: unknown; expiresAt?: unknown };
    return (
      typeof session.login === "string" &&
      session.login.toLowerCase() === allowedLogin.toLowerCase() &&
      typeof session.expiresAt === "number" &&
      session.expiresAt > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function sameOrigin(request: Request): boolean {
  return request.headers.get("origin") === new URL(request.url).origin;
}
