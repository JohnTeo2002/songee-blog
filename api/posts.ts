import { BLOG_TAGS, type BlogTag } from "../src/consts";
import {
  ADMIN_SESSION_COOKIE,
  isPublishingConfigured,
  isValidAdminSession,
  readCookie,
  sameOrigin,
} from "../src/lib/admin-auth";

const json = (data: unknown, status = 200) =>
  Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isValidTags(value: unknown): value is BlogTag[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((tag: unknown): tag is BlogTag =>
      BLOG_TAGS.some((validTag) => validTag === tag)
    ) &&
    new Set(value).size === value.length
  );
}

function slugFromTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export async function POST(request: Request): Promise<Response> {
  if (
    !(await isValidAdminSession(readCookie(request, ADMIN_SESSION_COOKIE)))
  ) {
    return json(
      { error: "Sign in with the authorized GitHub account first." },
      401
    );
  }
  if (!sameOrigin(request)) {
    return json({ error: "Invalid request origin." }, 403);
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ error: "Expected a JSON request." }, 415);
  }

  let input: unknown;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, "utf8") > 1_000_000) {
      return json({ error: "Post content is too large." }, 413);
    }
    input = JSON.parse(body);
  } catch {
    return json({ error: "Request body must be valid JSON." }, 400);
  }
  if (!isRecord(input)) {
    return json({ error: "Post details are required." }, 400);
  }

  const title = typeof input.title === "string" ? input.title.trim() : "";
  const description =
    typeof input.description === "string" ? input.description.trim() : "";
  const body = typeof input.body === "string" ? input.body.trim() : "";
  const pubDate = input.pubDate;
  const tags = input.tags;

  if (!title || title.length > 160) {
    return json(
      { error: "Title is required and must be 160 characters or fewer." },
      400
    );
  }
  if (!description || description.length > 320) {
    return json(
      { error: "Description is required and must be 320 characters or fewer." },
      400
    );
  }
  if (!body || body.length > 800_000) {
    return json(
      { error: "Post body is required and must be 800,000 characters or fewer." },
      400
    );
  }
  if (!validDate(pubDate)) {
    return json({ error: "Publish date must be a valid YYYY-MM-DD date." }, 400);
  }
  if (!isValidTags(tags)) {
    return json({ error: "Choose at least one valid, unique post tag." }, 400);
  }

  const titleSlug = slugFromTitle(title);
  if (!titleSlug) {
    return json(
      { error: "Title needs at least one English letter or number." },
      400
    );
  }
  const slug = `${pubDate}-${titleSlug}`;
  if (!isPublishingConfigured()) {
    return json({ error: "Publishing is not configured on the server." }, 503);
  }

  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repository) {
    return json({ error: "Publishing is not configured on the server." }, 503);
  }

  const mdx = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `pubDate: ${JSON.stringify(pubDate)}`,
    `tags: ${JSON.stringify(tags)}`,
    "draft: false",
    "---",
    "",
    body,
    "",
  ].join("\n");
  if (Buffer.byteLength(mdx, "utf8") > 900_000) {
    return json({ error: "Post content is too large to publish." }, 413);
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.github.com/repos/${repository}/contents/src/content/blog/${slug}.mdx`,
      {
        method: "PUT",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "songee-blog-admin",
        },
        body: JSON.stringify({
          message: `Publish post: ${title}`,
          content: Buffer.from(mdx, "utf8").toString("base64"),
          branch,
        }),
      }
    );
  } catch {
    return json(
      { error: "GitHub could not be reached. No post was published; please retry." },
      502
    );
  }

  if (!response.ok) {
    const error =
      response.status === 422
        ? `A post with slug "${slug}" already exists. Change the title to make it unique.`
        : `GitHub could not publish this post (HTTP ${response.status}).`;
    return json({ error }, response.status === 422 ? 409 : 502);
  }

  return json({ slug, path: `/blog/${slug}` }, 201);
}
