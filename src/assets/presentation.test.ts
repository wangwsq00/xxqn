import { describe, expect, it } from "vitest";
import { ATB_MAX } from "../combat/constants";
import { BattleEngine } from "../combat/engine";
import { makeCombatant } from "../combat/factory";
import type { CombatStats } from "../combat/types";
import { DOCK_HIT_HEIGHT } from "../ui/theme";
import {
  atbFillRatio,
  PRESENTATION_FILES,
  spiritArrayFx,
  spiritArrayTier,
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
  });
});

describe("M2 presentation files", () => {
  it("ships dock icons and three array tiers", () => {
    expect(PRESENTATION_FILES.map((file) => file.path)).toEqual([
      "assets/ui/icon_dongfu.png",
      "assets/ui/icon_trial.png",
      "assets/ui/icon_growth.png",
      "assets/fx/array_tier1.png",
      "assets/fx/array_tier2.png",
      "assets/fx/array_tier3.png",
    ]);
    expect(DOCK_HIT_HEIGHT).toBeGreaterThanOrEqual(88);
  });
});

describe("M2 shared speed bar mapping", () => {
  it("clamps the engine ATB onto 0..1", () => {
    expect(atbFillRatio(0)).toBe(0);
    expect(atbFillRatio(ATB_MAX / 2)).toBeCloseTo(0.5);
    expect(atbFillRatio(ATB_MAX)).toBe(1);
    expect(atbFillRatio(ATB_MAX + 200)).toBe(1);
    expect(atbFillRatio(-10)).toBe(0);
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
