import { afterEach, describe, expect, it, vi } from "vitest";
import { WOODEN_SWORD_DEF_ID } from "../equip/catalog";
import { starterEquipment } from "../equip/state";
import { QIXING_JIANZHEN_ID, TIANGANG_HUTI_ID } from "../gongfa/catalog";
import { starterGongfa } from "../gongfa/state";
import { STARTER_STONES } from "../idle/constants";
import { starterTrial } from "../trial/state";
import { defaultSave, loadSave, migrateSave, persistSave, SAVE_KEY } from "./storage";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

describe("save migrate and load", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gives new saves M1 starter stones and no gathering array", () => {
    const save = defaultSave(1000);
    expect(save.player.stones).toBe(STARTER_STONES);
    expect(save.player.gatheringArrayLevel).toBe(0);
    expect(save.gongfa.owned).toEqual([QIXING_JIANZHEN_ID, TIANGANG_HUTI_ID]);
    expect(save.gongfa.slots).toEqual([null, null, null, null]);
  });

  it("fills idle fields for the M1 stub save shape", () => {
    const migrated = migrateSave({
      version: 1,
      savedAt: 1000,
      player: { realmMajor: 1, realmLayer: 1, lingqi: 12, stones: 3 },
    });
    expect(migrated?.idle.lastSettleAt).toBe(1000);
    expect(migrated?.player.gatheringArrayLevel).toBe(0);
    expect(migrated?.player.lingqi).toBe(12);
    expect(migrated?.player.stones).toBe(3);
    expect(migrated?.equipment.items[0]?.defId).toBe(WOODEN_SWORD_DEF_ID);
    expect(migrated?.equipment.equipped.weapon).toBeUndefined();
    expect(migrated?.gongfa.owned).toEqual([QIXING_JIANZHEN_ID, TIANGANG_HUTI_ID]);
    expect(migrated?.gongfa.slots).toEqual([null, null, null, null]);
    expect(migrated?.trial.highestCleared).toBe(0);
  });

  it("accrues offline pending into LocalStorage on load", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    persistSave(
      {
        version: 1,
        savedAt: 0,
        player: {
          realmMajor: 1,
          realmLayer: 1,
          lingqi: 0,
          stones: 0,
          gatheringArrayLevel: 0,
        },
        idle: {
          lastSettleAt: 0,
          pendingLingqi: 0,
          pendingStones: 0,
          lastOfflineSeconds: 0,
        },
        equipment: starterEquipment(),
        gongfa: starterGongfa(),
        trial: starterTrial(),
      },
      0,
    );
    const loaded = loadSave(120_000);
    expect(loaded.idle.pendingLingqi).toBe(120);
    expect(loaded.idle.pendingStones).toBeCloseTo(2);
    expect(loaded.player.lingqi).toBe(0);
    const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? "{}");
    expect(stored.idle.pendingLingqi).toBe(120);
    expect(stored.equipment.items[0].defId).toBe(WOODEN_SWORD_DEF_ID);
    expect(stored.gongfa.owned).toContain(QIXING_JIANZHEN_ID);
  });

  it("auto-applies small-layer ups from stored lingqi on load", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    persistSave(
      {
        version: 1,
        savedAt: 50,
        player: {
          realmMajor: 1,
          realmLayer: 1,
          lingqi: 100,
          stones: 0,
          gatheringArrayLevel: 0,
        },
        idle: {
          lastSettleAt: 50,
          pendingLingqi: 0,
          pendingStones: 0,
          lastOfflineSeconds: 0,
        },
        equipment: starterEquipment(),
        gongfa: starterGongfa(),
        trial: starterTrial(),
      },
      50,
    );
    const loaded = loadSave(50);
    expect(loaded.player.realmLayer).toBe(2);
    expect(loaded.player.realmMajor).toBe(1);
    expect(loaded.player.lingqi).toBeCloseTo(0);
    const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? "{}");
    expect(stored.player.realmLayer).toBe(2);
  });

  it("does not auto-break 炼气九层 into 筑基 on load", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    persistSave(
      {
        version: 1,
        savedAt: 80,
        player: {
          realmMajor: 1,
          realmLayer: 9,
          lingqi: 500,
          stones: 0,
          gatheringArrayLevel: 0,
        },
        idle: {
          lastSettleAt: 80,
          pendingLingqi: 0,
          pendingStones: 0,
          lastOfflineSeconds: 0,
        },
        equipment: starterEquipment(),
        gongfa: starterGongfa(),
        trial: starterTrial(),
      },
      80,
    );
    const loaded = loadSave(80);
    expect(loaded.player.realmMajor).toBe(1);
    expect(loaded.player.realmLayer).toBe(9);
    expect(loaded.player.lingqi).toBe(500);
  });

  it("keeps highest cleared trial stage across load", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    persistSave(
      {
        ...defaultSave(90),
        trial: { highestCleared: 2 },
      },
      90,
    );
    const loaded = loadSave(90);
    expect(loaded.trial.highestCleared).toBe(2);
    const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? "{}");
    expect(stored.trial.highestCleared).toBe(2);
  });
});
