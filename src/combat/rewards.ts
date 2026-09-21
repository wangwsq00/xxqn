import { grantWoodenSwordIfMissing } from "../equip/state";
import type { SaveData } from "../save/types";
import {
  getTrialStage,
  TRIAL_STAGE_COUNT,
  TRIAL_VICTORY_STONES as STAGE_ONE_STONES,
} from "../trial/catalog";
import { isTrialStageUnlocked, recordTrialClear } from "../trial/state";

/**
 * 第 1 关试炼胜利灵石（工程默认），兼容既有单场测试。
 *
 * `05_战斗系统.md`「战斗奖励」与 `07_经济系统.md` 均为「待补充」。
 * **不采用**聊天稿约 80 关掉落表。失败不发。
 */
export const TRIAL_VICTORY_STONES = STAGE_ONE_STONES;

export interface TrialVictoryLoot {
  stones: number;
  woodenSwordGranted: boolean;
  stageId: number;
  unlockedNext: boolean;
}

export interface TrialVictoryResult {
  save: SaveData;
  loot: TrialVictoryLoot;
  lines: string[];
}

/**
 * 试炼胜利入账：按关发放灵石；若尚未拥有木剑则补入背包；刷新已通最高关。
 * 灵气仍走洞府挂机，本切片不另发。未解锁关不发奖励、不推进进度。
 */
export function applyTrialVictoryRewards(save: SaveData, stageId = 1): TrialVictoryResult {
  const stage = getTrialStage(stageId);
  if (!isTrialStageUnlocked(save.trial.highestCleared, stage.id)) {
    return {
      save,
      loot: { stones: 0, woodenSwordGranted: false, stageId: stage.id, unlockedNext: false },
      lines: ["该关尚未解锁"],
    };
  }
  const sword = grantWoodenSwordIfMissing(save.equipment);
  const stones = stage.stones;
  const nextStones = save.player.stones + stones;
  const prevCleared = save.trial.highestCleared;
  const trial = recordTrialClear(save.trial, stage.id);
  const newlyCleared = trial.highestCleared > prevCleared;
  const unlockedNext = newlyCleared && stage.id < TRIAL_STAGE_COUNT;
  const next: SaveData = {
    ...save,
    player: {
      ...save.player,
      stones: nextStones,
    },
    equipment: sword.equipment,
    trial,
  };
  const lines = [`获得 灵石 ${stones}`, `现有灵石 ${Math.floor(nextStones)}`];
  if (sword.granted) {
    lines.push("获得 木剑（已放入背包）");
  }
  if (unlockedNext) {
    const nextStage = getTrialStage(stage.id + 1);
    lines.push(`已解锁 第${nextStage.id}关 ${nextStage.name}`);
  } else if (newlyCleared && trial.highestCleared >= TRIAL_STAGE_COUNT) {
    lines.push("三关试炼均已通关");
  }
  return {
    save: next,
    loot: {
      stones,
      woodenSwordGranted: sword.granted,
      stageId: stage.id,
      unlockedNext,
    },
    lines,
  };
}

export function formatVictoryRewardText(
  lines: string[],
  returnHint = "点击任意处返回洞府",
): string {
  return [...lines, returnHint].join("\n");
}
