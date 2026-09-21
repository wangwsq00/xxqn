import type { SaveData } from "../save/types";
import { MAX_OFFLINE_SECONDS } from "./constants";
import { qiPerSecond, stonesPerSecond } from "./rates";

export interface IdleAccrual {
  elapsedSeconds: number;
  creditedSeconds: number;
  capped: boolean;
  gainedLingqi: number;
  gainedStones: number;
}

export interface AccrueResult {
  save: SaveData;
  accrual: IdleAccrual;
}

/**
 * 把 lastSettleAt 到 now 的时间记入待领取。
 * 单次结算超过 8 小时的部分丢弃，并把游标推到 now，避免溢出被下次再领。
 * 不足 1 秒的余量保留在游标上，避免在线 tick 提前刷新时丢时间。
 */
export function accrueIdle(save: SaveData, now = Date.now()): AccrueResult {
  const elapsedMs = Math.max(0, now - save.idle.lastSettleAt);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  const creditedSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);
  const capped = elapsedSeconds > MAX_OFFLINE_SECONDS;
  const qiRate = qiPerSecond(save.player.realmMajor, save.player.gatheringArrayLevel);
  const stoneRate = stonesPerSecond(save.player.realmMajor);
  const gainedLingqi = creditedSeconds * qiRate;
  const gainedStones = creditedSeconds * stoneRate;
  const nextSettleAt = capped ? now : save.idle.lastSettleAt + creditedSeconds * 1000;

  return {
    save: {
      ...save,
      player: { ...save.player },
      idle: {
        lastSettleAt: nextSettleAt,
        pendingLingqi: save.idle.pendingLingqi + gainedLingqi,
        pendingStones: save.idle.pendingStones + gainedStones,
        lastOfflineSeconds: elapsedSeconds,
      },
    },
    accrual: {
      elapsedSeconds,
      creditedSeconds,
      capped,
      gainedLingqi,
      gainedStones,
    },
  };
}

export function claimableAmounts(save: SaveData): { lingqi: number; stones: number } {
  return {
    lingqi: Math.floor(save.idle.pendingLingqi),
    stones: Math.floor(save.idle.pendingStones),
  };
}

export function hasClaimable(save: SaveData): boolean {
  const { lingqi, stones } = claimableAmounts(save);
  return lingqi > 0 || stones > 0;
}

/** 先结算到 now，再把待领取的整数部分转入角色钱包。 */
export function claimIdle(save: SaveData, now = Date.now()): AccrueResult {
  const accrued = accrueIdle(save, now);
  const lingqi = Math.floor(accrued.save.idle.pendingLingqi);
  const stones = Math.floor(accrued.save.idle.pendingStones);
  return {
    save: {
      ...accrued.save,
      player: {
        ...accrued.save.player,
        lingqi: accrued.save.player.lingqi + lingqi,
        stones: accrued.save.player.stones + stones,
      },
      idle: {
        ...accrued.save.idle,
        pendingLingqi: accrued.save.idle.pendingLingqi - lingqi,
        pendingStones: accrued.save.idle.pendingStones - stones,
      },
    },
    accrual: accrued.accrual,
  };
}

export function formatDuration(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} 小时`);
  }
  if (minutes > 0) {
    parts.push(`${minutes} 分`);
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} 秒`);
  }
  return parts.join(" ");
}

export function trimRate(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }
  const text = value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return text;
}
