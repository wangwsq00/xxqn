import { describe, expect, it } from "vitest";
import {
  getTrialStage,
  TRIAL_STAGE_COUNT,
  TRIAL_STAGES,
  TRIAL_VICTORY_STONES,
} from "./catalog";
import {
  hubTrialSummary,
  isTrialStageUnlocked,
  migrateTrial,
  nextUnlockedStageId,
  recordTrialClear,
  starterTrial,
  trialStageStatus,
} from "./state";

describe("trial stages", () => {
  it("defines at least 3 stages with rising enemy stats and stone rewards", () => {
    expect(TRIAL_STAGES).toHaveLength(TRIAL_STAGE_COUNT);
    expect(TRIAL_STAGE_COUNT).toBeGreaterThanOrEqual(3);
    expect(TRIAL_VICTORY_STONES).toBe(50);
    expect(TRIAL_STAGES.map((stage) => stage.stones)).toEqual([50, 60, 70]);
    const hp = TRIAL_STAGES.map((stage) => stage.enemies[0]?.hp ?? 0);
    const atk = TRIAL_STAGES.map((stage) => stage.enemies[0]?.atk ?? 0);
    expect(hp[0]).toBe(180);
    expect(hp[1]).toBeGreaterThan(hp[0]!);
    expect(hp[2]).toBeGreaterThan(hp[1]!);
    expect(atk[1]).toBeGreaterThan(atk[0]!);
    expect(atk[2]).toBeGreaterThan(atk[1]!);
  });

  it("keeps stage 1 unlocked and unlocks N+1 after clearing N", () => {
    expect(starterTrial().highestCleared).toBe(0);
    expect(isTrialStageUnlocked(0, 1)).toBe(true);
    expect(isTrialStageUnlocked(0, 2)).toBe(false);
    expect(trialStageStatus(0, 1)).toBe("next");
    expect(trialStageStatus(0, 2)).toBe("locked");
    expect(nextUnlockedStageId(0)).toBe(1);

    const afterOne = recordTrialClear(starterTrial(), 1);
    expect(afterOne.highestCleared).toBe(1);
    expect(isTrialStageUnlocked(1, 2)).toBe(true);
    expect(isTrialStageUnlocked(1, 3)).toBe(false);
    expect(trialStageStatus(1, 1)).toBe("cleared");
    expect(trialStageStatus(1, 2)).toBe("next");
    expect(nextUnlockedStageId(1)).toBe(2);

    const afterTwo = recordTrialClear(afterOne, 2);
    expect(isTrialStageUnlocked(afterTwo.highestCleared, 3)).toBe(true);
    expect(nextUnlockedStageId(2)).toBe(3);

    const afterThree = recordTrialClear(afterTwo, 3);
    expect(afterThree.highestCleared).toBe(3);
    expect(nextUnlockedStageId(3)).toBe(3);
    expect(trialStageStatus(3, 3)).toBe("cleared");
  });

  it("does not lower highest cleared on a repeat win", () => {
    const high = recordTrialClear({ highestCleared: 3 }, 1);
    expect(high.highestCleared).toBe(3);
  });

  it("migrates missing trial progress to 0", () => {
    expect(migrateTrial(undefined).highestCleared).toBe(0);
    expect(migrateTrial({ highestCleared: 2 }).highestCleared).toBe(2);
    expect(migrateTrial({ highestCleared: 99 }).highestCleared).toBe(3);
  });

  it("summarizes the hub stage list and next unlocked stage", () => {
    expect(hubTrialSummary(0)).toContain("下一关 第1关 野修试炼");
    expect(hubTrialSummary(0)).toContain("第1关可挑战");
    expect(hubTrialSummary(0)).toContain("第2关未解锁");
    expect(hubTrialSummary(1)).toContain("下一关 第2关 邪修试炼");
    expect(hubTrialSummary(3)).toContain("三关均已通关");
    expect(getTrialStage(2).name).toBe("邪修试炼");
  });
});
