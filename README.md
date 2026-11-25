# songee.dev

Teo So Ngee's personal engineering blog — Astro + TypeScript + Tailwind CSS + MDX.

## Stack

- **Astro 5** (static pages) + Vercel serverless publisher API, strict TypeScript
- **Tailwind CSS v4** + `@tailwindcss/typography` for the reading column
- **MDX** for posts, with `astro-expressive-code` (dual light/dark themes, copy buttons, filenames) for code blocks
- **remark-math** + **rehype-katex** for LaTeX
- **Mermaid** (client-side, loaded only on posts that actually contain a ```mermaid block) for diagrams, re-rendered on theme toggle
- `@astrojs/rss` and `@astrojs/sitemap`

## Getting started

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-checks (astro check) then builds to dist/
npm run preview   # preview the built static site locally
```

## Editing your identity and socials

Everything author/site-identifying lives in **`src/consts.ts`** — name, site title, tagline, domain, and social links (LinkedIn, email, GitHub). Edit that one file to re-point the whole site.

## Writing a new post

### From the website

Open `/admin`, sign in with the authorized GitHub account, fill in the post
details and MDX body, then click **Publish post**. The editor creates the
frontmatter, commits the post to the configured GitHub branch, and Vercel
deploys the new commit. The admin session expires after seven days.

The website publisher requires the Vercel setup below. It fails closed until
all required environment variables are configured.

### From the command line

```bash
npm run new-post -- "My Post Title" --tags "Applied AI,Algorithms"
```

This creates a timestamped `.mdx` file in `src/content/blog/` with valid frontmatter (`title`, `description`, `pubDate`, `tags`, `draft: true`). Flip `draft` to `false` when it's ready to publish — draft posts are excluded from the blog archive, home page, and RSS feed, but you can still preview a draft locally via its direct `/blog/<slug>` URL.

Frontmatter fields:

| Field | Required | Notes |
|---|---|---|
| `title` | yes | |
| `description` | yes | Used for the post summary and meta description |
| `pubDate` | yes | `YYYY-MM-DD` |
| `updatedDate` | no | Shown next to the publish date if present |
| `tags` | yes | Must be from `BLOG_TAGS` in `src/consts.ts` |
| `draft` | no (default `false`) | |
| `canonicalUrl` | no | Set this if the post is also syndicated to Dev.to / Hashnode, so search engines credit the canonical source |

## Diagrams and math

- Fenced ` ```mermaid ` code blocks are detected automatically and rendered client-side as responsive SVG, in both flowchart and state-diagram form. No special component import needed — just write the fence.
- Inline math: `$O(N^3)$`. Display math: a `$$...$$` block.

## Deployment

Public pages are prerendered. The web publisher uses serverless functions in
`api/` and is available on Vercel; local Astro preview only serves static pages.

**Vercel**
- Framework preset: Astro (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`
- Connect the Vercel project to this GitHub repository and deploy from `main`.
  Vercel deploys the `api/` functions alongside the static site; publishing
  commits new posts to that branch to trigger production builds.

#### Configure the web publisher

1. Create a GitHub OAuth App with homepage URL `https://songee.dev` and
   authorization callback URL `https://songee.dev/api/auth/callback`.
2. Create a fine-grained GitHub token restricted to this repository, with
   **Contents: Read and write** permission.
3. Add these environment variables to the Vercel project (Production):

| Variable | Value |
|---|---|
| `ADMIN_GITHUB_LOGIN` | `JohnTeo2002` |
| `ADMIN_BASE_URL` | `https://songee.dev` |
| `GITHUB_OAUTH_CLIENT_ID` | OAuth App client ID |
| `GITHUB_OAUTH_CLIENT_SECRET` | OAuth App client secret |
| `ADMIN_SESSION_SECRET` | Random secret of at least 32 characters |
| `GITHUB_TOKEN` | Fine-grained token from step 2 |
| `GITHUB_REPOSITORY` | `JohnTeo2002/songee-blog` |
| `GITHUB_BRANCH` | `main` |

Keep the OAuth client secret, session secret, and GitHub token in Vercel's
environment-variable settings; never put them in browser code or commit them.
Redeploy after adding or changing environment variables. Once deployed, open
`https://songee.dev/admin` to write and publish.

Before deploying, update `SITE_URL` in `src/consts.ts` to your real domain — it feeds the sitemap, RSS feed, canonical URLs, and OpenGraph tags.
