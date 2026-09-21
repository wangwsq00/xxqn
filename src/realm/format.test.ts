import { describe, expect, it } from "vitest";
import { cultivationProgressText } from "./format";
import { realmLabel } from "./label";

describe("realm labels", () => {
  it("renders 炼气境一层 through 九层", () => {
    expect(realmLabel(1, 1)).toBe("炼气境一层");
    expect(realmLabel(1, 9)).toBe("炼气境九层");
    expect(realmLabel(2, 1)).toBe("筑基境一层");
  });
});

describe("cultivationProgressText", () => {
  it("shows the next small layer while below peak", () => {
    expect(cultivationProgressText(1, 1, 45)).toBe("修为 45 / 100  ·  升至炼气境二层");
  });

  it("shows breakthrough qi at layer 9", () => {
    const text = cultivationProgressText(1, 9, 10);
    expect(text).toContain("突破灵气 10 /");
    expect(text).toContain("上限");
  });
});
