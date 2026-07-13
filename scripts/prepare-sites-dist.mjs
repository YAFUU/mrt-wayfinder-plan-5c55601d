import { cp, mkdir, copyFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const publicDir = resolve(dist, "public");

await mkdir(resolve(dist, ".openai"), { recursive: true });
await mkdir(resolve(dist, "server"), { recursive: true });
await mkdir(publicDir, { recursive: true });
await copyFile(resolve(root, ".openai", "hosting.json"), resolve(dist, ".openai", "hosting.json"));
await copyFile(resolve(dist, "index.html"), resolve(publicDir, "index.html"));
await cp(resolve(dist, "assets"), resolve(publicDir, "assets"), { recursive: true, force: true });

await writeFile(
  resolve(dist, "server", "index.js"),
  `export default {
  async fetch(request, env) {
    const assets = env && env.ASSETS;

    if (assets && typeof assets.fetch === "function") {
      const response = await assets.fetch(request);
      if (response.status !== 404) return response;

      const url = new URL(request.url);
      url.pathname = "/index.html";
      url.search = "";
      return assets.fetch(new Request(url, request));
    }

    return new Response("MRT QuickPass deployment is ready.", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
`,
);
