// ---------------------------------------------------------------------------
// Site & author configuration.
// Everything that identifies the author or the deployed site lives here —
// edit this one file to re-point the blog at a new domain, name, or socials.
// ---------------------------------------------------------------------------

/** Change this when you deploy to your real domain (Cloudflare Pages / Vercel). */
export const SITE_URL = "https://songee.dev";

export const AUTHOR_NAME = "Teo So Ngee";

export const SITE_TITLE = "Teo So Ngee — Engineering & Systems";

export const SITE_DESCRIPTION =
  "AI Software Engineer. EE & CS @ NUS. Exploring Applied AI, Agentic Systems, Software Engineering, and IoT.";

export const TAGLINE = SITE_DESCRIPTION;

export const SOCIAL_LINKS = {
  linkedin: "https://linkedin.com/in/teosongee",
  email: "teosongee@u.nus.edu",
  github: "https://github.com/teosongee",
} as const;

/** Tag taxonomy used across /blog filtering, post frontmatter, and nav. */
export const BLOG_TAGS = [
  "Applied AI",
  "Backend & Systems",
  "Algorithms",
  "Hardware",
] as const;

export type BlogTag = (typeof BLOG_TAGS)[number];

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
] as const;
