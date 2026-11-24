import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import expressiveCode from "astro-expressive-code";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { SITE_URL } from "./src/consts.ts";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [
    expressiveCode({
      themes: ["github-dark", "github-light"],
      useDarkModeMediaQuery: false,
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
      styleOverrides: {
        codeFontFamily:
          "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        codeFontSize: "0.85rem",
        borderRadius: "0px",
        frames: {
          shadowColor: "transparent",
        },
      },
      defaultProps: {
        wrap: true,
      },
    }),
    mdx(),
    sitemap(),
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
