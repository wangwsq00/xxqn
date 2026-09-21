import { grantWoodenSwordIfMissing } from "../equip/state";
import type { SaveData } from "../save/types";

/**
 * M1 试炼胜利灵石（工程默认）。
 *
 * `05_战斗系统.md`「战斗奖励」与 `07_经济系统.md` 均为「待补充」。
 * **不采用**聊天稿约 80 关掉落表。失败不发。
 */
export const TRIAL_VICTORY_STONES = 50;

export interface TrialVictoryLoot {
  stones: number;
  woodenSwordGranted: boolean;
}

export interface TrialVictoryResult {
  save: SaveData;
  loot: TrialVictoryLoot;
  lines: string[];
}

/**
 * 试炼胜利入账：每次发放固定灵石；若尚未拥有木剑则补入背包。
 * 灵气仍走洞府挂机，本切片不另发。
 */
export function applyTrialVictoryRewards(save: SaveData): TrialVictoryResult {
  const sword = grantWoodenSwordIfMissing(save.equipment);
  const stones = TRIAL_VICTORY_STONES;
  const nextStones = save.player.stones + stones;
  const next: SaveData = {
    ...save,
    player: {
      ...save.player,
      stones: nextStones,
    },
    equipment: sword.equipment,
  };
  const lines = [`获得 灵石 ${stones}`, `现有灵石 ${Math.floor(nextStones)}`];
  if (sword.granted) {
    lines.push("获得 木剑（已放入背包）");
  }
  return {
    save: next,
    loot: { stones, woodenSwordGranted: sword.granted },
    lines,
  };
}

export function formatVictoryRewardText(lines: string[]): string {
  return [...lines, "点击任意处返回洞府"].join("\n");
}
