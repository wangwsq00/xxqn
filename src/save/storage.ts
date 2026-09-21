import { starterEquipment, migrateEquipment } from "../equip/state";
import { migrateGongfa, starterGongfa } from "../gongfa/state";
import { STARTER_STONES } from "../idle/constants";
import { migrateTrial, starterTrial } from "../trial/state";
import { clampGatheringLevel } from "../idle/gathering";
import { accrueIdle } from "../idle/settle";
import { clampLayer, clampMajor } from "../realm/costs";
import { applyMinorLayerUps } from "../realm/upgrade";
import type { SaveData } from "./types";

export { realmLabel } from "../realm/label";

export type { SaveData, SaveIdle, SavePlayer, SaveGongfa, SaveTrial } from "./types";

export const SAVE_KEY = "xxqn-save-v1";

export function defaultSave(now = Date.now()): SaveData {
  return {
    version: 1,
    savedAt: now,
    player: {
      realmMajor: 1,
      realmLayer: 1,
      lingqi: 0,
      stones: STARTER_STONES,
      gatheringArrayLevel: 0,
    },
    idle: {
      lastSettleAt: now,
      pendingLingqi: 0,
      pendingStones: 0,
      lastOfflineSeconds: 0,
    },
    equipment: starterEquipment(),
    gongfa: starterGongfa(),
    trial: starterTrial(),
  };
}

export function migrateSave(raw: unknown, now = Date.now()): SaveData | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const parsed = raw as Partial<SaveData> & {
    player?: Partial<SaveData["player"]>;
    idle?: Partial<SaveData["idle"]>;
  };
  if (parsed.version !== 1 || !parsed.player) {
    return null;
  }
  const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : now;
  const lastSettleAt =
    typeof parsed.idle?.lastSettleAt === "number" ? parsed.idle.lastSettleAt : savedAt;
  return {
    version: 1,
    savedAt,
    player: {
      realmMajor: clampMajor(parsed.player.realmMajor ?? 1),
      realmLayer: clampLayer(parsed.player.realmLayer ?? 1),
      lingqi: parsed.player.lingqi ?? 0,
      stones: parsed.player.stones ?? 0,
      gatheringArrayLevel: clampGatheringLevel(parsed.player.gatheringArrayLevel ?? 0),
    },
    idle: {
      lastSettleAt,
      pendingLingqi: parsed.idle?.pendingLingqi ?? 0,
      pendingStones: parsed.idle?.pendingStones ?? 0,
      lastOfflineSeconds: parsed.idle?.lastOfflineSeconds ?? 0,
    },
    equipment: migrateEquipment(parsed.equipment),
    gongfa: migrateGongfa(parsed.gongfa),
    trial: migrateTrial(parsed.trial),
  };
}

export function loadSave(now = Date.now()): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const fresh = defaultSave(now);
      persistSave(fresh, now);
      return fresh;
    }
    const migrated = migrateSave(JSON.parse(raw), now);
    if (!migrated) {
      const fresh = defaultSave(now);
      persistSave(fresh, now);
      return fresh;
    }
    const { save: accrued } = accrueIdle(migrated, now);
    const { save } = applyMinorLayerUps(accrued);
    persistSave(save, now);
    return save;
  } catch {
    return defaultSave(now);
  }
}

export function persistSave(save: SaveData, now = Date.now()): void {
  const next: SaveData = { ...save, savedAt: now };
  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
}
