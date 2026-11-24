#!/usr/bin/env node
// Usage: npm run new-post -- "My Post Title" [--tags "Applied AI,Algorithms"]
import { mkdir, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, "..", "src", "content", "blog");

const VALID_TAGS = ["Applied AI", "Backend & Systems", "Algorithms", "Hardware"];

function parseArgs(argv) {
  const args = argv.slice(2);
  const titleParts = [];
  let tags = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--tags") {
      const raw = args[i + 1] ?? "";
      tags = raw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      i++;
    } else {
      titleParts.push(args[i]);
    }
  }

  return { title: titleParts.join(" ").trim(), tags };
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function todayISODate() {
  return new Date().toISOString().split("T")[0];
}

async function main() {
  const { title, tags } = parseArgs(process.argv);

  if (!title) {
    console.error(
      '\nUsage: npm run new-post -- "My Post Title" [--tags "Applied AI,Algorithms"]\n'
    );
    process.exit(1);
  }

  const resolvedTags = tags.length
    ? tags.filter((t) => VALID_TAGS.includes(t))
    : [];

  if (tags.length && resolvedTags.length !== tags.length) {
    console.warn(
      `Warning: some tags were dropped — valid tags are: ${VALID_TAGS.join(", ")}`
    );
  }

  const date = todayISODate();
  const slug = `${date}-${slugify(title)}`;
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);

  try {
    await access(filePath);
    console.error(`A post already exists at ${filePath}`);
    process.exit(1);
  } catch {
    // Good — file does not exist yet.
  }

  await mkdir(BLOG_DIR, { recursive: true });

  const tagList = resolvedTags.length ? resolvedTags : ["Backend & Systems"];

  const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "One or two sentences summarizing this post."
pubDate: ${date}
tags: [${tagList.map((t) => `"${t}"`).join(", ")}]
draft: true
---

Start writing here.
`;

  await writeFile(filePath, frontmatter, "utf-8");
  console.log(`Created ${path.relative(process.cwd(), filePath)}`);
}

main();
