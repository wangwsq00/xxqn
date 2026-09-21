import { defineConfig } from "vitest/config";
import { resolveViteBase } from "./src/deploy/viteBase";

export default defineConfig({
  base: resolveViteBase(process.env),
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
