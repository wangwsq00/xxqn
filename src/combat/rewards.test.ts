import { afterEach, describe, expect, it, vi } from "vitest";
import { WOODEN_SWORD_DEF_ID } from "../equip/catalog";
import { defaultSave, loadSave, persistSave, SAVE_KEY } from "../save/storage";
import { STARTER_STONES } from "../idle/constants";
import {
  applyTrialVictoryRewards,
  formatVictoryRewardText,
  TRIAL_VICTORY_STONES,
} from "./rewards";

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

describe("trial victory rewards", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("grants M1 default stones each win and keeps gathering / idle fields", () => {
    const save = defaultSave(1_000);
    expect(save.player.stones).toBe(STARTER_STONES);
    expect(save.player.gatheringArrayLevel).toBe(0);

    const first = applyTrialVictoryRewards(save);
    expect(first.loot.stones).toBe(TRIAL_VICTORY_STONES);
    expect(first.loot.woodenSwordGranted).toBe(false);
    expect(first.save.player.stones).toBe(STARTER_STONES + TRIAL_VICTORY_STONES);
    expect(first.save.player.lingqi).toBe(save.player.lingqi);
    expect(first.save.player.gatheringArrayLevel).toBe(0);
    expect(first.save.idle).toEqual(save.idle);
    expect(first.lines[0]).toBe(`获得 灵石 ${TRIAL_VICTORY_STONES}`);
    expect(first.lines[1]).toBe(`现有灵石 ${STARTER_STONES + TRIAL_VICTORY_STONES}`);

    const second = applyTrialVictoryRewards(first.save);
    expect(second.save.player.stones).toBe(STARTER_STONES + TRIAL_VICTORY_STONES * 2);
    expect(second.loot.woodenSwordGranted).toBe(false);
  });

  it("still drops a wooden sword when the bag has none", () => {
    const save = defaultSave(2_000);
    save.equipment = { equipped: {}, items: [] };
    const result = applyTrialVictoryRewards(save);
    expect(result.loot.woodenSwordGranted).toBe(true);
    expect(result.save.equipment.items.some((item) => item.defId === WOODEN_SWORD_DEF_ID)).toBe(
      true,
    );
    expect(result.lines).toContain("获得 木剑（已放入背包）");
  });

  it("formats victory copy for the overlay", () => {
    expect(formatVictoryRewardText(["获得 灵石 50", "现有灵石 650"])).toBe(
      "获得 灵石 50\n现有灵石 650\n点击任意处返回洞府",
    );
  });

  it("writes stones into LocalStorage so hub load sees the wallet", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    const t0 = 5_000;
    const rewarded = applyTrialVictoryRewards(defaultSave(t0));
    persistSave(rewarded.save, t0);
    const loaded = loadSave(t0);
    expect(loaded.player.stones).toBe(STARTER_STONES + TRIAL_VICTORY_STONES);
    const stored = JSON.parse(storage.getItem(SAVE_KEY) ?? "{}");
    expect(stored.player.stones).toBe(STARTER_STONES + TRIAL_VICTORY_STONES);
  });
});
