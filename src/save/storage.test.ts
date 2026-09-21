import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSave, migrateSave, persistSave, SAVE_KEY } from "./storage";

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
      },
      0,
    );
    const loaded = loadSave(120_000);
    expect(loaded.idle.pendingLingqi).toBe(120);
    expect(loaded.idle.pendingStones).toBeCloseTo(2);
    expect(loaded.player.lingqi).toBe(0);
    const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? "{}");
    expect(stored.idle.pendingLingqi).toBe(120);
  });
});
