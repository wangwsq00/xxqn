import {
  clampTrialStageId,
  getTrialStage,
  TRIAL_STAGE_COUNT,
  TRIAL_STAGES,
} from "./catalog";
import type { SaveTrial } from "./types";

export function starterTrial(): SaveTrial {
  return { highestCleared: 0 };
}

export function clampHighestCleared(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(TRIAL_STAGE_COUNT, Math.max(0, Math.floor(value)));
}

export function migrateTrial(raw: unknown): SaveTrial {
  if (!raw || typeof raw !== "object") {
    return starterTrial();
  }
  const parsed = raw as Partial<SaveTrial>;
  return { highestCleared: clampHighestCleared(parsed.highestCleared ?? 0) };
}

export function isTrialStageUnlocked(highestCleared: number, stageId: number): boolean {
  const id = clampTrialStageId(stageId);
  return id <= clampHighestCleared(highestCleared) + 1;
}

export function nextUnlockedStageId(highestCleared: number): number {
  return Math.min(TRIAL_STAGE_COUNT, clampHighestCleared(highestCleared) + 1);
}

export function recordTrialClear(trial: SaveTrial, stageId: number): SaveTrial {
  const cleared = clampTrialStageId(stageId);
  return { highestCleared: Math.max(trial.highestCleared, cleared) };
}

export function trialStageStatus(
  highestCleared: number,
  stageId: number,
): "cleared" | "next" | "locked" {
  const id = clampTrialStageId(stageId);
  const cleared = clampHighestCleared(highestCleared);
  if (id <= cleared) {
    return "cleared";
  }
  if (id === cleared + 1) {
    return "next";
  }
  return "locked";
}

export function trialStatusLabel(status: ReturnType<typeof trialStageStatus>): string {
  if (status === "cleared") {
    return "已通关";
  }
  if (status === "next") {
    return "可挑战";
  }
  return "未解锁";
}

export function hubTrialSummary(highestCleared: number): string {
  const cleared = clampHighestCleared(highestCleared);
  const list = TRIAL_STAGES.map((stage) => {
    const status = trialStageStatus(cleared, stage.id);
    return `第${stage.id}关${trialStatusLabel(status)}`;
  }).join(" · ");
  if (cleared >= TRIAL_STAGE_COUNT) {
    return `试炼：三关均已通关\n${list}`;
  }
  const next = getTrialStage(nextUnlockedStageId(cleared));
  return `试炼：下一关 第${next.id}关 ${next.name}\n${list}`;
}
