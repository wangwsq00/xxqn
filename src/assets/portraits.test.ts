import { describe, expect, it } from "vitest";
import { PORTRAIT, PORTRAIT_FILES } from "./portraits";

describe("M1 portrait files", () => {
  it("lists six unique Phaser keys matching public/assets filenames", () => {
    const keys = PORTRAIT_FILES.map((file) => file.key);
    expect(keys).toEqual([
      PORTRAIT.playerHero,
      PORTRAIT.petLinghu,
      PORTRAIT.enemyWild,
      PORTRAIT.enemyEvil,
      PORTRAIT.enemyDemon,
      PORTRAIT.enemyHeartDemon,
    ]);
    expect(new Set(keys).size).toBe(6);
    for (const file of PORTRAIT_FILES) {
      expect(file.path).toBe(`assets/${file.key}.png`);
    }
  });
});
