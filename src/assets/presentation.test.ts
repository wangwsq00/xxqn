import { describe, expect, it } from "vitest";
import { ATB_MAX } from "../combat/constants";
import { BattleEngine, compareReady } from "../combat/engine";
import { makeCombatant } from "../combat/factory";
import type { CombatStats } from "../combat/types";
import { DOCK_HIT_HEIGHT } from "../ui/theme";
import { HUB_HERO_FEET_Y } from "./portraits";
import {
  absorbMoveToLocal,
  atbFillRatio,
  HUB_ABSORB_DEPTH,
  HUB_ARRAY_CENTER_X,
  HUB_ARRAY_CENTER_Y,
  HUB_DOCK_DEPTH,
  HUB_MEDITATE,
  HUB_MEDITATE_HEIGHT,
  PRESENTATION_CANDIDATES,
  PRESENTATION_FILES,
  resolvePresentationFile,
  skillFxTextureId,
  SKILL_FX,
  speedBarIconX,
  spiritArrayFx,
  spiritArrayTier,
  UI_ICON,
  UI_ICON_ON,
} from "./presentation";

function stats(spd: number): CombatStats {
  return {
    hp: 200,
    maxHp: 200,
    atk: 20,
    def: 0,
    spd,
    hit: 100,
    dodge: 0,
    crit: 0,
    critResist: 0,
    block: 0,
    blockResist: 0,
  };
}

describe("M2 spirit array tier", () => {
  it("uses gathering level when the array is built", () => {
    expect(spiritArrayTier(1, 9)).toBe(1);
    expect(spiritArrayTier(3, 9)).toBe(1);
    expect(spiritArrayTier(4, 1)).toBe(2);
    expect(spiritArrayTier(6, 1)).toBe(2);
    expect(spiritArrayTier(7, 1)).toBe(3);
    expect(spiritArrayTier(10, 1)).toBe(3);
  });

  it("falls back to realm band when array level is missing or zero", () => {
    expect(spiritArrayTier(0, 1)).toBe(1);
    expect(spiritArrayTier(0, 3)).toBe(1);
    expect(spiritArrayTier(undefined, 4)).toBe(2);
    expect(spiritArrayTier(null, 6)).toBe(2);
    expect(spiritArrayTier(Number.NaN, 7)).toBe(3);
    expect(spiritArrayTier(0, 9)).toBe(3);
  });

  it("scales absorb intensity with tier", () => {
    const low = spiritArrayFx(1);
    const mid = spiritArrayFx(2);
    const high = spiritArrayFx(3);
    expect(high.particleFrequency).toBeLessThan(mid.particleFrequency);
    expect(mid.particleFrequency).toBeLessThan(low.particleFrequency);
    expect(high.moteSpeed).toBeGreaterThan(low.moteSpeed);
    expect(high.glowAlpha).toBeGreaterThan(low.glowAlpha);
    expect(high.rotateMs).toBeLessThan(low.rotateMs);
    expect(low.breatheMs).toBeGreaterThanOrEqual(2400);
    expect(low.breatheMs).toBeLessThanOrEqual(3200);
    expect(high.breatheMs).toBeGreaterThanOrEqual(2400);
    expect(high.breatheMs).toBeLessThanOrEqual(3200);
    expect(high.breatheMs).toBeLessThan(mid.breatheMs);
    expect(mid.breatheMs).toBeLessThan(low.breatheMs);
  });
});

describe("M2 presentation files", () => {
  it("prefers official paths and falls back to the earlier icons and arrays", () => {
    const dongfu = PRESENTATION_CANDIDATES.find((item) => item.id === UI_ICON.dongfu);
    const arrayLow = PRESENTATION_CANDIDATES.find((item) => item.id === "fx_array_low");
    expect(dongfu?.official).toBe("assets/ui/icons/icon_tab_dongfu.png");
    expect(arrayLow?.official).toBe("assets/fx/array/fx_array_low.png");
    const both = new Set([
      "assets/ui/icons/icon_tab_dongfu.png",
      "assets/ui/icon_dongfu.png",
      "assets/fx/array/fx_array_low.png",
      "assets/fx/array_tier1.png",
    ]);
    expect(resolvePresentationFile(dongfu!, both)?.path).toBe("assets/ui/icons/icon_tab_dongfu.png");
    expect(resolvePresentationFile(arrayLow!, both)?.path).toBe("assets/fx/array/fx_array_low.png");
    const fallbackOnly = new Set(["assets/ui/icon_dongfu.png", "assets/fx/array_tier1.png"]);
    expect(resolvePresentationFile(dongfu!, fallbackOnly)?.path).toBe("assets/ui/icon_dongfu.png");
    expect(resolvePresentationFile(arrayLow!, fallbackOnly)?.path).toBe("assets/fx/array_tier1.png");

    const byKey = new Map(PRESENTATION_FILES.map((file) => [file.key, file.path]));
    expect(byKey.get(UI_ICON.dongfu)).toBe("assets/ui/icons/icon_tab_dongfu.png");
    expect(byKey.get(UI_ICON.trial)).toBe("assets/ui/icons/icon_tab_trial.png");
    expect(byKey.get(UI_ICON.cultivate)).toBe("assets/ui/icons/icon_tab_cultivate.png");
    expect(byKey.get(UI_ICON_ON.dongfu)).toBe("assets/ui/icons/icon_tab_dongfu_on.png");
    expect(byKey.get(UI_ICON_ON.trial)).toBe("assets/ui/icons/icon_tab_trial_on.png");
    expect(byKey.get(UI_ICON_ON.cultivate)).toBe("assets/ui/icons/icon_tab_cultivate_on.png");
    expect(byKey.get("fx_array_low")).toBe("assets/fx/array/fx_array_low.png");
    expect(byKey.get("fx_array_mid")).toBe("assets/fx/array/fx_array_mid.png");
    expect(byKey.get("fx_array_high")).toBe("assets/fx/array/fx_array_high.png");
    expect(byKey.get(SKILL_FX.swordqi)).toBe("assets/fx/skill/fx_skill_swordqi.png");
    expect(byKey.get(SKILL_FX.fireball)).toBe("assets/fx/skill/fx_skill_fireball.png");
    expect(byKey.get(SKILL_FX.shockwave)).toBe("assets/fx/skill/fx_skill_shockwave.png");
    expect(byKey.get("avatar_player_hero")).toBe("assets/ui/avatar/avatar_player_hero.png");
    expect(byKey.get("avatar_pet_linghu")).toBe("assets/ui/avatar/avatar_pet_linghu.png");
    expect(byKey.get("avatar_enemy_wild")).toBe("assets/ui/avatar/avatar_enemy_wild.png");
    expect(byKey.get("avatar_enemy_evil")).toBe("assets/ui/avatar/avatar_enemy_evil.png");
    expect(byKey.get("avatar_enemy_demon")).toBe("assets/ui/avatar/avatar_enemy_demon.png");
    expect(byKey.get("avatar_enemy_heart_demon")).toBe("assets/ui/avatar/avatar_enemy_heart_demon.png");
    expect(byKey.get(HUB_MEDITATE)).toBe("assets/char/hero_meditate.png");
    expect(HUB_HERO_FEET_Y - HUB_MEDITATE_HEIGHT).toBeGreaterThanOrEqual(240);
    expect(HUB_ARRAY_CENTER_X).toBe(360);
    expect(HUB_ARRAY_CENTER_Y).toBe(760);
    expect(HUB_ARRAY_CENTER_Y).toBeLessThan(HUB_HERO_FEET_Y);
    expect(HUB_ABSORB_DEPTH).toBeLessThan(HUB_DOCK_DEPTH);
    expect(DOCK_HIT_HEIGHT).toBeGreaterThanOrEqual(88);
    const inward = absorbMoveToLocal(HUB_ARRAY_CENTER_Y, HUB_HERO_FEET_Y - 240);
    expect(inward.x).toBe(0);
    expect(inward.y).toBeLessThan(0);
    expect(absorbMoveToLocal(760, 900).y).toBe(-40);
    expect(skillFxTextureId("七星剑阵")).toBe(SKILL_FX.swordqi);
    expect(skillFxTextureId("天罡护体")).toBe(SKILL_FX.shockwave);
    expect(skillFxTextureId("普通攻击")).toBeNull();
  });
});

describe("M2 shared speed bar mapping", () => {
  it("clamps the engine ATB onto 0..1 and never reads speed", () => {
    expect(atbFillRatio(0)).toBe(0);
    expect(atbFillRatio(ATB_MAX / 2)).toBeCloseTo(0.5);
    expect(atbFillRatio(ATB_MAX)).toBe(1);
    expect(atbFillRatio(ATB_MAX + 200)).toBe(1);
    expect(atbFillRatio(-10)).toBe(0);
    const fast = makeCombatant({
      id: "fast",
      name: "快",
      side: "ally",
      slot: 1,
      stats: stats(500),
    });
    const slow = makeCombatant({
      id: "slow",
      name: "慢",
      side: "enemy",
      slot: 5,
      stats: stats(20),
    });
    fast.atb = 400;
    slow.atb = 400;
    expect(speedBarIconX(10, 200, fast.atb)).toBe(speedBarIconX(10, 200, slow.atb));
    expect(speedBarIconX(10, 200, 0)).toBe(10);
    expect(speedBarIconX(10, 200, ATB_MAX)).toBe(210);
  });

  it("breaks a full-bar pile with the engine order: speed, then slot, then allies", () => {
    const allyFastSlot2 = makeCombatant({
      id: "ally-fast-slot2",
      name: "甲",
      side: "ally",
      slot: 2,
      stats: stats(80),
    });
    const allyFastSlot1 = makeCombatant({
      id: "ally-fast-slot1",
      name: "乙",
      side: "ally",
      slot: 1,
      stats: stats(80),
    });
    const enemyFastSlot1 = makeCombatant({
      id: "enemy-fast-slot1",
      name: "丙",
      side: "enemy",
      slot: 1,
      stats: stats(80),
    });
    const slow = makeCombatant({
      id: "slow",
      name: "丁",
      side: "ally",
      slot: 1,
      stats: stats(10),
    });
    const piled = [allyFastSlot2, enemyFastSlot1, slow, allyFastSlot1];
    for (const unit of piled) {
      unit.atb = ATB_MAX;
    }
    expect([...piled].sort(compareReady).map((unit) => unit.id)).toEqual([
      "ally-fast-slot1",
      "enemy-fast-slot1",
      "ally-fast-slot2",
      "slow",
    ]);
    const engine = new BattleEngine(piled);
    const acted: string[] = [];
    for (let i = 0; i < 4; i += 1) {
      const action = engine.tick();
      expect(action).not.toBeNull();
      acted.push(action!.actorId);
      expect(engine.units.find((unit) => unit.id === action!.actorId)?.atb).toBe(0);
    }
    expect(acted).toEqual(["ally-fast-slot1", "enemy-fast-slot1", "ally-fast-slot2", "slow"]);
  });

  it("follows real ATB so a fast unit can act twice before a slow unit acts", () => {
    const fast = makeCombatant({
      id: "fast",
      name: "快",
      side: "ally",
      slot: 1,
      stats: stats(500),
    });
    const slow = makeCombatant({
      id: "slow",
      name: "慢",
      side: "enemy",
      slot: 1,
      stats: stats(100),
    });
    const engine = new BattleEngine([fast, slow]);
    let fastActs = 0;
    let slowActs = 0;
    const ratios: number[] = [];
    for (let i = 0; i < 6; i += 1) {
      ratios.push(atbFillRatio(fast.atb));
      const action = engine.tick();
      if (action?.actorId === "fast") {
        fastActs += 1;
        expect(atbFillRatio(fast.atb)).toBe(0);
      }
      if (action?.actorId === "slow") {
        slowActs += 1;
      }
    }
    expect(ratios[1]).toBeGreaterThan(ratios[0] ?? 0);
    expect(fastActs).toBeGreaterThanOrEqual(2);
    expect(slowActs).toBe(0);
    expect(atbFillRatio(slow.atb)).toBeLessThan(1);
  });
});
