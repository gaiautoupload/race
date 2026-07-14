import { cp, mkdir, rm } from "node:fs/promises";
await rm("gh-pages", { recursive: true, force: true });
await mkdir("gh-pages", { recursive: true });
await cp("github-pages", "gh-pages", { recursive: true });
await cp("public/data", "gh-pages/data", { recursive: true });
console.log("Built static GitHub Pages artifact: gh-pages/");
