import { cp, mkdir, copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
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

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

async function collectFiles(dir, routePrefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = {};

  for (const entry of entries) {
    const absolutePath = join(dir, entry.name);
    const routePath = `${routePrefix}/${entry.name}`;

    if (entry.isDirectory()) {
      Object.assign(files, await collectFiles(absolutePath, routePath));
      continue;
    }

    const extension = entry.name.slice(entry.name.lastIndexOf("."));
    files[routePath] = {
      body: await readFile(absolutePath, "utf8"),
      type: contentTypes[extension] ?? "application/octet-stream",
    };
  }

  return files;
}

const staticFiles = await collectFiles(publicDir);

await writeFile(
  resolve(dist, "server", "index.js"),
  `const FILES = ${JSON.stringify(staticFiles)};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const normalizedPath = url.pathname === "/" ? "/index.html" : url.pathname;
    const file = FILES[normalizedPath] ?? FILES["/index.html"];

    return new Response(file.body, {
      headers: {
        "content-type": file.type,
        "cache-control": normalizedPath.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      },
    });
  },
};
`,
);
