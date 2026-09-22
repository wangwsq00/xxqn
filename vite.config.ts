import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { defineConfig } from "vitest/config";
import { resolveViteBase } from "./src/deploy/viteBase";

/** 只注入路径字符串。官方 png 放进 public/ 后，同一逻辑 id 会改用官方文件，图片仍由 Phaser 从 public 加载。 */
function listPublicPngs(root: string): string[] {
  const base = join(root, "public");
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (name.endsWith(".png")) {
        out.push(relative(base, full).split("\\").join("/"));
      }
    }
  };
  walk(base);
  return out;
}

export default defineConfig({
  base: resolveViteBase(process.env),
  define: {
    __XXQN_SHIPPED_ASSETS__: JSON.stringify(listPublicPngs(process.cwd())),
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
