import { describe, expect, it } from "vitest";
import { MAX_OFFLINE_SECONDS, QI_PER_SECOND_BY_MAJOR } from "./constants";
import { gatheringBonus, qiPerSecond, stonesPerMinute, stonesPerSecond } from "./rates";
import { accrueIdle, claimIdle, formatDuration, hasClaimable } from "./settle";
import { defaultSave } from "../save/storage";

describe("idle rates", () => {
  it("uses realm qi/s from the character document", () => {
    expect(qiPerSecond(1)).toBe(1);
    expect(qiPerSecond(2)).toBe(2);
    expect(qiPerSecond(9)).toBe(256);
    expect(QI_PER_SECOND_BY_MAJOR).toEqual([1, 2, 4, 8, 16, 32, 64, 128, 256]);
  });

  it("applies gathering array bonus only to lingqi", () => {
    expect(gatheringBonus(1)).toBeCloseTo(0.1);
    expect(qiPerSecond(1, 1)).toBeCloseTo(1.1);
    expect(qiPerSecond(1, 10)).toBeCloseTo(2);
    expect(stonesPerSecond(1)).toBeCloseTo(1 / 60);
    expect(stonesPerMinute(2)).toBe(2);
  });
});

describe("idle settlement", () => {
  it("accrues lingqi and stones into pending without touching the wallet", () => {
    const t0 = 1_000_000;
    const save = defaultSave(t0);
    const { save: next, accrual } = accrueIdle(save, t0 + 60_000);
    expect(accrual.creditedSeconds).toBe(60);
    expect(accrual.capped).toBe(false);
    expect(next.idle.pendingLingqi).toBe(60);
    expect(next.idle.pendingStones).toBeCloseTo(1);
    expect(next.player.lingqi).toBe(0);
    expect(next.player.stones).toBe(0);
  });

  it("caps a single offline gap at 8 hours and discards the overflow", () => {
    const t0 = 5_000_000;
    const save = defaultSave(t0);
    const nineHours = (8 * 60 * 60 + 3600) * 1000;
    const { save: next, accrual } = accrueIdle(save, t0 + nineHours);
    expect(accrual.elapsedSeconds).toBe(9 * 3600);
    expect(accrual.creditedSeconds).toBe(MAX_OFFLINE_SECONDS);
    expect(accrual.capped).toBe(true);
    expect(next.idle.pendingLingqi).toBe(MAX_OFFLINE_SECONDS);
    expect(next.idle.lastSettleAt).toBe(t0 + nineHours);

    const later = accrueIdle(next, t0 + nineHours + 10_000);
    expect(later.accrual.creditedSeconds).toBe(10);
    expect(later.save.idle.pendingLingqi).toBe(MAX_OFFLINE_SECONDS + 10);
  });

  it("keeps sub-second remainder so early ticks do not drop time", () => {
    const t0 = 8_000_000;
    const save = defaultSave(t0);
    const first = accrueIdle(save, t0 + 1500);
    expect(first.accrual.creditedSeconds).toBe(1);
    expect(first.save.idle.lastSettleAt).toBe(t0 + 1000);
    const second = accrueIdle(first.save, t0 + 2000);
    expect(second.accrual.creditedSeconds).toBe(1);
    expect(second.save.idle.pendingLingqi).toBe(2);
  });

  it("claims floor amounts into the wallet and leaves the fractional remainder", () => {
    const t0 = 9_000_000;
    const save = defaultSave(t0);
    const claimed = claimIdle(save, t0 + 90_000);
    expect(claimed.save.player.lingqi).toBe(90);
    expect(claimed.save.player.stones).toBe(1);
    expect(claimed.save.idle.pendingLingqi).toBe(0);
    expect(claimed.save.idle.pendingStones).toBeCloseTo(0.5);
    expect(hasClaimable(claimed.save)).toBe(false);
  });
});

describe("formatDuration", () => {
  it("renders chinese time parts", () => {
    expect(formatDuration(0)).toBe("0 秒");
    expect(formatDuration(3661)).toBe("1 小时 1 分 1 秒");
    expect(formatDuration(MAX_OFFLINE_SECONDS)).toBe("8 小时");
  });
});
