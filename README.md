# songee.dev

Teo So Ngee's personal engineering blog — Astro + TypeScript + Tailwind CSS + MDX.

## Stack

- **Astro 5** (static output), strict TypeScript
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
npm run preview   # serve the production build locally
```

## Editing your identity and socials

Everything author/site-identifying lives in **`src/consts.ts`** — name, site title, tagline, domain, and social links (LinkedIn, email, GitHub). Edit that one file to re-point the whole site.

## Writing a new post

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

The site builds to fully static HTML in `dist/` — no server runtime required.

**Cloudflare Pages**
- Build command: `npm run build`
- Output directory: `dist`

**Vercel**
- Framework preset: Astro (auto-detected)
- Build command: `npm run build`
- Output directory: `dist`

Before deploying, update `SITE_URL` in `src/consts.ts` to your real domain — it feeds the sitemap, RSS feed, canonical URLs, and OpenGraph tags.
