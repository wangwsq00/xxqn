import { starterEquipment, migrateEquipment } from "../equip/state";
import { accrueIdle } from "../idle/settle";
import type { SaveData } from "./types";

export type { SaveData, SaveIdle, SavePlayer } from "./types";

export const SAVE_KEY = "xxqn-save-v1";

export function defaultSave(now = Date.now()): SaveData {
  return {
    version: 1,
    savedAt: now,
    player: {
      realmMajor: 1,
      realmLayer: 1,
      lingqi: 0,
      stones: 0,
      gatheringArrayLevel: 0,
    },
    idle: {
      lastSettleAt: now,
      pendingLingqi: 0,
      pendingStones: 0,
      lastOfflineSeconds: 0,
    },
    equipment: starterEquipment(),
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
      realmMajor: parsed.player.realmMajor ?? 1,
      realmLayer: parsed.player.realmLayer ?? 1,
      lingqi: parsed.player.lingqi ?? 0,
      stones: parsed.player.stones ?? 0,
      gatheringArrayLevel: parsed.player.gatheringArrayLevel ?? 0,
    },
    idle: {
      lastSettleAt,
      pendingLingqi: parsed.idle?.pendingLingqi ?? 0,
      pendingStones: parsed.idle?.pendingStones ?? 0,
      lastOfflineSeconds: parsed.idle?.lastOfflineSeconds ?? 0,
    },
    equipment: migrateEquipment(parsed.equipment),
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
    const { save } = accrueIdle(migrated, now);
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

export function realmLabel(major: number, layer: number): string {
  const majors = ["炼气境", "筑基境", "金丹境", "元婴境", "化神境", "炼虚境", "合体境", "大乘境", "渡劫境"];
  const name = majors[major - 1] ?? "炼气境";
  const layers = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return `${name}${layers[layer - 1] ?? "一"}层`;
}
