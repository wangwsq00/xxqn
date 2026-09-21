import { describe, expect, it } from "vitest";
import { ALLY_SLOT_X, SLOT_FOOT_Y } from "../combat/constants";
import { PORTRAIT, PORTRAIT_FILES, SPRITE_KEY_BY_LABEL } from "./portraits";

describe("M1 portrait files", () => {
  it("lists six unique Phaser keys under char/pet/enemy", () => {
    expect(PORTRAIT_FILES.map((file) => file.key)).toEqual([
      PORTRAIT.playerHero,
      PORTRAIT.petLinghu,
      PORTRAIT.enemyWild,
      PORTRAIT.enemyEvil,
      PORTRAIT.enemyDemon,
      PORTRAIT.enemyHeartDemon,
    ]);
    expect(PORTRAIT_FILES.map((file) => file.path)).toEqual([
      "assets/char/player_hero.png",
      "assets/pet/pet_linghu.png",
      "assets/enemy/enemy_wild.png",
      "assets/enemy/enemy_evil.png",
      "assets/enemy/enemy_demon.png",
      "assets/enemy/enemy_heart_demon.png",
    ]);
  });

  it("maps 显示名 to sprite keys and never uses rabbit/wolf filenames", () => {
    expect(SPRITE_KEY_BY_LABEL["主角"]).toBe("player_hero");
    expect(SPRITE_KEY_BY_LABEL["灵狐"]).toBe("pet_linghu");
    expect(SPRITE_KEY_BY_LABEL["野修"]).toBe("enemy_wild");
    expect(SPRITE_KEY_BY_LABEL["邪修"]).toBe("enemy_evil");
    expect(SPRITE_KEY_BY_LABEL["魔修"]).toBe("enemy_demon");
    expect(SPRITE_KEY_BY_LABEL["心魔"]).toBe("enemy_heart_demon");
    for (const file of PORTRAIT_FILES) {
      expect(file.path).not.toMatch(/rabbit|wolf/i);
      expect(file.key).not.toMatch(/rabbit|wolf/i);
    }
  });

  it("pins battle foot anchors: 主角 slot1 (150,452) and 灵宠 slot2 (150,320)", () => {
    expect(ALLY_SLOT_X).toBe(150);
    expect(SLOT_FOOT_Y[1]).toBe(452);
    expect(SLOT_FOOT_Y[2]).toBe(320);
    expect(SLOT_FOOT_Y[4]).toBe(188);
    expect(SLOT_FOOT_Y[3]).toBe(584);
    expect(SLOT_FOOT_Y[5]).toBe(716);
  });
});
