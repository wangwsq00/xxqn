import { describe, expect, it } from "vitest";
import { resolveViteBase } from "./viteBase";

describe("resolveViteBase", () => {
  it("defaults to / for local builds", () => {
    expect(resolveViteBase({})).toBe("/");
    expect(resolveViteBase({ NODE_ENV: "production" })).toBe("/");
  });

  it("uses VITE_BASE override and normalizes trailing slash", () => {
    expect(resolveViteBase({ VITE_BASE: "/xxqn/" })).toBe("/xxqn/");
    expect(resolveViteBase({ VITE_BASE: "/xxqn" })).toBe("/xxqn/");
    expect(resolveViteBase({ BASE_PATH: "/custom/" })).toBe("/custom/");
  });

  it("prefers VITE_BASE over GitHub Actions repo inference", () => {
    expect(
      resolveViteBase({
        VITE_BASE: "/",
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "wangwsq00/xxqn",
      }),
    ).toBe("/");
  });

  it("infers project pages path from GITHUB_REPOSITORY", () => {
    expect(
      resolveViteBase({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "wangwsq00/xxqn",
      }),
    ).toBe("/xxqn/");
  });

  it("uses / for user or org GitHub Pages repos", () => {
    expect(
      resolveViteBase({
        GITHUB_ACTIONS: "true",
        GITHUB_REPOSITORY: "wangwsq00/wangwsq00.github.io",
      }),
    ).toBe("/");
  });
});
