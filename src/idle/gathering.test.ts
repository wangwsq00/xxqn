import { describe, expect, it } from "vitest";
import { defaultSave } from "../save/storage";
import {
  GATHERING_LEVEL_COSTS,
  MAX_GATHERING_LEVEL,
  STARTER_STONES,
} from "./constants";
import {
  clampGatheringLevel,
  nextGatheringCost,
  purchaseGathering,
} from "./gathering";
import { qiPerSecond } from "./rates";
import { accrueIdle } from "./settle";

describe("gathering catalog", () => {
  it("uses the character document prices for levels 1–10", () => {
    expect(GATHERING_LEVEL_COSTS).toEqual([
      100, 500, 2_000, 8_000, 30_000, 100_000, 300_000, 800_000, 2_000_000, 5_000_000,
    ]);
    expect(nextGatheringCost(0)).toBe(100);
    expect(nextGatheringCost(1)).toBe(500);
    expect(nextGatheringCost(9)).toBe(5_000_000);
    expect(nextGatheringCost(10)).toBeNull();
    expect(clampGatheringLevel(99)).toBe(MAX_GATHERING_LEVEL);
  });
});

describe("purchaseGathering", () => {
  it("buys level 1 with starter stones and raises lingqi rate", () => {
    const t0 = 2_000_000;
    const save = defaultSave(t0);
    expect(save.player.stones).toBe(STARTER_STONES);
    expect(qiPerSecond(save.player.realmMajor, save.player.gatheringArrayLevel)).toBe(1);

    const bought = purchaseGathering(save, t0);
    expect(bought.ok).toBe(true);
    expect(bought.save.player.gatheringArrayLevel).toBe(1);
    expect(bought.save.player.stones).toBe(STARTER_STONES - 100);
    expect(qiPerSecond(1, bought.save.player.gatheringArrayLevel)).toBeCloseTo(1.1);
    expect(bought.message).toBe("已布置聚灵阵 1 级");
  });

  it("upgrades to level 2 and keeps pending accrual at the old rate", () => {
    const t0 = 3_000_000;
    const save = defaultSave(t0);
    const level1 = purchaseGathering(save, t0);
    expect(level1.ok).toBe(true);

    const afterMinute = accrueIdle(level1.save, t0 + 60_000);
    expect(afterMinute.save.idle.pendingLingqi).toBeCloseTo(66);
    expect(afterMinute.save.player.gatheringArrayLevel).toBe(1);

    const upgraded = purchaseGathering(afterMinute.save, t0 + 60_000);
    expect(upgraded.ok).toBe(true);
    expect(upgraded.save.player.gatheringArrayLevel).toBe(2);
    expect(upgraded.save.player.stones).toBe(STARTER_STONES - 100 - 500);
    expect(upgraded.save.idle.pendingLingqi).toBeCloseTo(66);
    expect(qiPerSecond(1, 2)).toBeCloseTo(1.2);

    const later = accrueIdle(upgraded.save, t0 + 120_000);
    expect(later.save.idle.pendingLingqi).toBeCloseTo(66 + 72);
  });

  it("rejects purchase when stones are not enough", () => {
    const t0 = 4_000_000;
    const save = defaultSave(t0);
    save.player.stones = 99;
    const result = purchaseGathering(save, t0);
    expect(result.ok).toBe(false);
    expect(result.save.player.gatheringArrayLevel).toBe(0);
    expect(result.save.player.stones).toBe(99);
    expect(result.message).toContain("灵石不足");
  });

  it("rejects purchase at max level", () => {
    const t0 = 5_000_000;
    const save = defaultSave(t0);
    save.player.gatheringArrayLevel = 10;
    save.player.stones = 9_999_999;
    const result = purchaseGathering(save, t0);
    expect(result.ok).toBe(false);
    expect(result.save.player.gatheringArrayLevel).toBe(10);
    expect(result.message).toBe("聚灵阵已达最高 10 级");
  });
});
