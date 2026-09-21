import { describe, expect, it } from "vitest";
import { qiPerSecond } from "../idle/rates";
import { defaultSave } from "../save/storage";
import {
  applyHeartDemonDefeat,
  applyHeartDemonVictory,
  canChallengeHeartDemon,
  heartDemonHint,
} from "./breakthrough";
import { breakthroughQiRequirement, qiCap } from "./costs";
import { applyMinorLayerUps } from "./upgrade";

function peakSave(lingqi: number, major = 1, layer = 9) {
  const save = defaultSave(0);
  return {
    ...save,
    player: {
      ...save.player,
      realmMajor: major,
      realmLayer: layer,
      lingqi,
      stones: 777,
      gatheringArrayLevel: 2,
    },
  };
}

describe("canChallengeHeartDemon", () => {
  it("rejects layers below 9 and qi below 100%", () => {
    expect(canChallengeHeartDemon(peakSave(500, 1, 8))).toBe(false);
    const need = breakthroughQiRequirement(1);
    expect(canChallengeHeartDemon(peakSave(need * 0.99))).toBe(false);
    expect(canChallengeHeartDemon(peakSave(need))).toBe(true);
    expect(canChallengeHeartDemon(peakSave(qiCap(1, 9)))).toBe(true);
  });

  it("rejects 渡劫九层", () => {
    expect(canChallengeHeartDemon(peakSave(1_000_000, 9, 9))).toBe(false);
  });
});

describe("heartDemonHint", () => {
  it("stays empty below peak and names the next major when ready", () => {
    expect(heartDemonHint(defaultSave(0))).toBe("");
    expect(heartDemonHint(peakSave(0))).toContain("灵气达 100%");
    expect(heartDemonHint(peakSave(0))).toContain("筑基境");
    expect(heartDemonHint(peakSave(breakthroughQiRequirement(1)))).toBe(
      "战胜心魔即可破境进入筑基境一层",
    );
  });
});

describe("applyHeartDemonVictory", () => {
  it("sets 炼气九层 to 筑基一层, clears qi, and keeps wallet / gathering / gear", () => {
    const before = peakSave(breakthroughQiRequirement(1) * 1.5);
    const equipped = before.equipment;
    const result = applyHeartDemonVictory(before);
    expect(result.succeeded).toBe(true);
    expect(result.save.player.realmMajor).toBe(2);
    expect(result.save.player.realmLayer).toBe(1);
    expect(result.save.player.lingqi).toBe(0);
    expect(result.save.player.stones).toBe(777);
    expect(result.save.player.gatheringArrayLevel).toBe(2);
    expect(result.save.equipment).toBe(equipped);
    expect(result.save.idle).toEqual(before.idle);
    expect(qiPerSecond(result.save.player.realmMajor, 2)).toBeCloseTo(2 * 1.2);
  });

  it("does not break through when the fight was not eligible", () => {
    const before = peakSave(10);
    const result = applyHeartDemonVictory(before);
    expect(result.succeeded).toBe(false);
    expect(result.save.player.realmMajor).toBe(1);
    expect(result.save.player.realmLayer).toBe(9);
    expect(result.save.player.lingqi).toBe(10);
  });
});

describe("applyHeartDemonDefeat", () => {
  it("leaves realm and lingqi untouched for a soft retry", () => {
    const before = peakSave(500);
    const result = applyHeartDemonDefeat(before);
    expect(result.succeeded).toBe(false);
    expect(result.save).toBe(before);
    expect(result.save.player.lingqi).toBe(500);
    expect(result.save.player.realmLayer).toBe(9);
  });
});

describe("minor layer ups stay inside a major realm", () => {
  it("still will not auto-break 炼气九层 into 筑基", () => {
    const result = applyMinorLayerUps(peakSave(qiCap(1, 9) + 10_000, 1, 8));
    expect(result.save.player.realmMajor).toBe(1);
    expect(result.save.player.realmLayer).toBe(9);
    expect(canChallengeHeartDemon(result.save)).toBe(true);
  });
});
