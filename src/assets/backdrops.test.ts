import { describe, expect, it } from "vitest";
import { BACKDROP, BACKDROP_FILES, coverPlacement } from "./backdrops";
import { DOCK_HEIGHT, DOCK_HIT_HEIGHT, PALETTE, UI_BTN_PAD_X, UI_BTN_PAD_Y, UI_PANEL_SIZE, UI_PANEL_SLICE } from "../ui/theme";
import { BATTLE_ENEMY_HEIGHT, BATTLE_HERO_HEIGHT, HUB_HERO_FEET_X, HUB_HERO_FEET_Y, HUB_HERO_HEIGHT, HUB_PET_HEIGHT_RATIO } from "./portraits";

describe("M1 backdrops", () => {
  it("loads three backgrounds from public/assets/bg", () => {
    expect(BACKDROP_FILES.map((file) => file.key)).toEqual([
      BACKDROP.dongfu,
      BACKDROP.trial,
      BACKDROP.battle,
    ]);
    expect(BACKDROP_FILES.map((file) => file.path)).toEqual([
      "assets/bg/bg_dongfu.png",
      "assets/bg/bg_trial.png",
      "assets/bg/bg_battle.png",
    ]);
  });

  it("covers a 720×1280 frame with the 1280×720 paintings", () => {
    const placed = coverPlacement(720, 1280, 1280, 720, 0.74, 0.5);
    expect(placed.scale).toBeCloseTo(1280 / 720);
    expect(placed.y).toBeCloseTo(640);
    expect(placed.x).toBeLessThan(360);
  });
});

describe("M1 visual spec constants", () => {
  it("locks palette, dock, and nine-slice metrics", () => {
    expect(PALETTE.ink).toBe(0x1a2a3a);
    expect(PALETTE.inkDeep).toBe(0x2e4050);
    expect(PALETTE.parchment).toBe(0xf3e6c8);
    expect(PALETTE.cinnabar).toBe(0xc23b22);
    expect(PALETTE.gold).toBe(0xc9a227);
    expect(PALETTE.cyan).toBe(0x3aa8a0);
    expect(PALETTE.stroke).toBe(0x0e1620);
    expect(PALETTE.body).toBe(0xfff8ee);
    expect(DOCK_HEIGHT).toBe(152);
    expect(DOCK_HIT_HEIGHT).toBeGreaterThanOrEqual(96);
    expect(DOCK_HIT_HEIGHT).toBeLessThanOrEqual(DOCK_HEIGHT);
    expect(UI_PANEL_SIZE).toBe(256);
    expect(UI_PANEL_SLICE).toBe(32);
    expect(UI_BTN_PAD_X).toBe(24);
    expect(UI_BTN_PAD_Y).toBe(20);
  });

  it("locks hub and battle portrait display sizes", () => {
    expect(HUB_HERO_HEIGHT).toBeGreaterThanOrEqual(380);
    expect(HUB_HERO_HEIGHT).toBeLessThanOrEqual(440);
    expect(HUB_HERO_FEET_X).toBe(360);
    expect(HUB_HERO_FEET_Y).toBe(780);
    expect(HUB_PET_HEIGHT_RATIO).toBeGreaterThanOrEqual(0.55);
    expect(HUB_PET_HEIGHT_RATIO).toBeLessThanOrEqual(0.65);
    expect(BATTLE_HERO_HEIGHT).toBeGreaterThanOrEqual(340);
    expect(BATTLE_HERO_HEIGHT).toBeLessThanOrEqual(400);
    expect(BATTLE_ENEMY_HEIGHT).toBeGreaterThanOrEqual(200);
    expect(BATTLE_ENEMY_HEIGHT).toBeLessThanOrEqual(240);
  });
});
