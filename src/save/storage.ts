const SAVE_KEY = "xxqn-save-v1";
const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
const QI_PER_SECOND_LIANQI = 1;

export interface SaveData {
  version: 1;
  savedAt: number;
  player: {
    realmMajor: number;
    realmLayer: number;
    lingqi: number;
    stones: number;
  };
}

export function defaultSave(): SaveData {
  return {
    version: 1,
    savedAt: Date.now(),
    player: {
      realmMajor: 1,
      realmLayer: 1,
      lingqi: 0,
      stones: 0,
    },
  };
}

export function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const fresh = defaultSave();
      persistSave(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw) as SaveData;
    if (parsed.version !== 1 || !parsed.player) {
      return defaultSave();
    }
    return settleIdle(parsed);
  } catch {
    return defaultSave();
  }
}

export function persistSave(save: SaveData): void {
  const next = { ...save, savedAt: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify(next));
}

/** 炼气境 1 灵气/秒；离线封顶 8 小时。 */
export function settleIdle(save: SaveData, now = Date.now()): SaveData {
  const elapsed = Math.max(0, Math.floor((now - save.savedAt) / 1000));
  const gained = Math.min(elapsed, MAX_OFFLINE_SECONDS) * QI_PER_SECOND_LIANQI;
  return {
    ...save,
    savedAt: now,
    player: {
      ...save.player,
      lingqi: save.player.lingqi + gained,
    },
  };
}

export function realmLabel(major: number, layer: number): string {
  const majors = ["炼气境", "筑基境", "金丹境", "元婴境", "化神境", "炼虚境", "合体境", "大乘境", "渡劫境"];
  const name = majors[major - 1] ?? "炼气境";
  const layers = ["一", "二", "三", "四", "五", "六", "七", "八", "九"];
  return `${name}${layers[layer - 1] ?? "一"}层`;
}
