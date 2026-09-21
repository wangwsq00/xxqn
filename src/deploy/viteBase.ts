/**
 * Vite `base` for GitHub Pages vs local/dev.
 *
 * - Override: `VITE_BASE` or `BASE_PATH` (trailing slash added if missing).
 * - GitHub Actions: project pages → `/<repo>/`; user/org pages (`*.github.io`) → `/`.
 * - Local `npm run build` / `npm run preview` / `npm run dev` → `/`.
 */
export function resolveViteBase(env: Record<string, string | undefined>): string {
  const override = env.VITE_BASE ?? env.BASE_PATH;
  if (override !== undefined && override !== "") {
    return override.endsWith("/") ? override : `${override}/`;
  }

  if (env.GITHUB_ACTIONS === "true" && env.GITHUB_REPOSITORY) {
    const repo = env.GITHUB_REPOSITORY.split("/")[1] ?? "";
    if (repo.endsWith(".github.io") || repo === "") {
      return "/";
    }
    return `/${repo}/`;
  }

  return "/";
}
