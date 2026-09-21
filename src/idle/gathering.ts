import type { SaveData } from "../save/types";
import { GATHERING_LEVEL_COSTS, MAX_GATHERING_LEVEL } from "./constants";
import { gatheringBonus } from "./rates";
import { accrueIdle } from "./settle";

export function clampGatheringLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 0;
  }
  return Math.min(MAX_GATHERING_LEVEL, Math.max(0, Math.floor(level)));
}

/** 升到 currentLevel+1 所需灵石；已满级返回 null。 */
export function nextGatheringCost(currentLevel: number): number | null {
  const level = clampGatheringLevel(currentLevel);
  if (level >= MAX_GATHERING_LEVEL) {
    return null;
  }
  return GATHERING_LEVEL_COSTS[level] ?? null;
}

export function gatheringBonusPercent(level: number): number {
  return Math.round(gatheringBonus(level) * 100);
}

export function formatStoneCost(cost: number): string {
  return `${cost.toLocaleString("zh-CN")} 灵石`;
}

export interface GatheringPurchaseResult {
  save: SaveData;
  ok: boolean;
  message: string;
}

/**
 * 先按当前等级结算挂机，再消耗灵石布置/升级一级。
 * 已累计的待领取仍按旧速率，之后才用新加成。
 */
export function purchaseGathering(save: SaveData, now = Date.now()): GatheringPurchaseResult {
  const { save: accrued } = accrueIdle(save, now);
  const level = clampGatheringLevel(accrued.player.gatheringArrayLevel);
  const cost = nextGatheringCost(level);
  if (cost == null) {
    return { save: accrued, ok: false, message: "聚灵阵已达最高 10 级" };
  }

  const stones = Math.floor(accrued.player.stones);
  const nextLevel = level + 1;
  const action = level === 0 ? `布置 1 级` : `升到 ${nextLevel} 级`;
  if (stones < cost) {
    return {
      save: accrued,
      ok: false,
      message: `灵石不足，${action}需要 ${formatStoneCost(cost)}`,
    };
  }

  return {
    save: {
      ...accrued,
      player: {
        ...accrued.player,
        gatheringArrayLevel: nextLevel,
        stones: accrued.player.stones - cost,
      },
    },
    ok: true,
    message: level === 0 ? "已布置聚灵阵 1 级" : `聚灵阵升至 ${nextLevel} 级`,
  };
}
