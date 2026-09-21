import {
  GATHERING_ARRAY_BONUS_PER_LEVEL,
  MAX_GATHERING_LEVEL,
  QI_PER_SECOND_BY_MAJOR,
  STONES_PER_MINUTE_LIANQI,
} from "./constants";

function clampMajor(realmMajor: number): number {
  if (!Number.isFinite(realmMajor)) {
    return 1;
  }
  return Math.min(9, Math.max(1, Math.floor(realmMajor)));
}

function realmMultiplier(realmMajor: number): number {
  return QI_PER_SECOND_BY_MAJOR[clampMajor(realmMajor) - 1] ?? 1;
}

/** 聚灵阵加成比例：1 级 = 0.1。 */
export function gatheringBonus(gatheringArrayLevel: number): number {
  const level = Number.isFinite(gatheringArrayLevel) ? Math.max(0, Math.floor(gatheringArrayLevel)) : 0;
  return Math.min(MAX_GATHERING_LEVEL, level) * GATHERING_ARRAY_BONUS_PER_LEVEL;
}

/** 实际灵气/秒 = 基础灵气/秒 × (1 + 聚灵阵加成)。 */
export function qiPerSecond(realmMajor: number, gatheringArrayLevel = 0): number {
  return realmMultiplier(realmMajor) * (1 + gatheringBonus(gatheringArrayLevel));
}

/** 灵石/秒。聚灵阵只加速灵气，不影响灵石。 */
export function stonesPerSecond(realmMajor: number): number {
  return (STONES_PER_MINUTE_LIANQI / 60) * realmMultiplier(realmMajor);
}

export function stonesPerMinute(realmMajor: number): number {
  return stonesPerSecond(realmMajor) * 60;
}
