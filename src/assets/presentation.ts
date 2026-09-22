import { ATB_MAX } from "../combat/constants";

/** M2 表现层切图。底栏图标与聚灵阵法阵，不参与数值。 */

export const UI_ICON = {
  dongfu: "icon_dongfu",
  trial: "icon_trial",
  growth: "icon_growth",
} as const;

export const SPIRIT_ARRAY = {
  tier1: "array_tier1",
  tier2: "array_tier2",
  tier3: "array_tier3",
} as const;

/** 洞府打坐莲座全身像。头像和战斗仍用 player_hero。 */
export const HUB_MEDITATE = "hero_meditate";

/**
 * 莲座图显示高度。脚底仍是 portraits 里的 (360, 780)。
 * 比半身立绘略高，头顶留在修为条文案下面。
 */
export const HUB_MEDITATE_HEIGHT = 500;

export interface PresentationFile {
  key: string;
  path: string;
}

export const PRESENTATION_FILES: PresentationFile[] = [
  { key: UI_ICON.dongfu, path: "assets/ui/icon_dongfu.png" },
  { key: UI_ICON.trial, path: "assets/ui/icon_trial.png" },
  { key: UI_ICON.growth, path: "assets/ui/icon_growth.png" },
  { key: SPIRIT_ARRAY.tier1, path: "assets/fx/array_tier1.png" },
  { key: SPIRIT_ARRAY.tier2, path: "assets/fx/array_tier2.png" },
  { key: SPIRIT_ARRAY.tier3, path: "assets/fx/array_tier3.png" },
  { key: HUB_MEDITATE, path: "assets/char/hero_meditate.png" },
];

export type ArrayTier = 1 | 2 | 3;

export interface SpiritArrayFx {
  /** 转一圈的毫秒数。阶越高转得越快。 */
  rotateMs: number;
  /** 粒子发射间隔（毫秒）。越小越密。 */
  particleFrequency: number;
  moteSpeed: number;
  glowAlpha: number;
  glowRadius: number;
  alphaMin: number;
}

/**
 * 聚灵阵阶。有等级时按等级分档；0、缺失或非数字时改按大境分档。
 * 1–3 级 / 炼气–金丹 → 一阶；4–6 级 / 元婴–炼虚 → 二阶；7–10 级 / 合体–渡劫 → 三阶。
 */
export function spiritArrayTier(
  gatheringLevel: number | null | undefined,
  realmMajor: number,
): ArrayTier {
  const level =
    typeof gatheringLevel === "number" && Number.isFinite(gatheringLevel)
      ? Math.floor(gatheringLevel)
      : 0;
  if (level <= 0) {
    const major = Number.isFinite(realmMajor) ? Math.min(9, Math.max(1, Math.floor(realmMajor))) : 1;
    if (major <= 3) {
      return 1;
    }
    if (major <= 6) {
      return 2;
    }
    return 3;
  }
  if (level <= 3) {
    return 1;
  }
  if (level <= 6) {
    return 2;
  }
  return 3;
}

export function spiritArrayTextureKey(tier: ArrayTier): string {
  if (tier === 1) {
    return SPIRIT_ARRAY.tier1;
  }
  if (tier === 2) {
    return SPIRIT_ARRAY.tier2;
  }
  return SPIRIT_ARRAY.tier3;
}

export function spiritArrayFx(tier: ArrayTier): SpiritArrayFx {
  if (tier === 1) {
    return {
      rotateMs: 22000,
      particleFrequency: 140,
      moteSpeed: 140,
      glowAlpha: 0.22,
      glowRadius: 78,
      alphaMin: 0.72,
    };
  }
  if (tier === 2) {
    return {
      rotateMs: 16000,
      particleFrequency: 80,
      moteSpeed: 180,
      glowAlpha: 0.34,
      glowRadius: 98,
      alphaMin: 0.78,
    };
  }
  return {
    rotateMs: 11000,
    particleFrequency: 46,
    moteSpeed: 230,
    glowAlpha: 0.48,
    glowRadius: 118,
    alphaMin: 0.84,
  };
}

/**
 * 速度条进度。只读 `Combatant.atb / ATB_MAX`。
 * 速度只决定引擎每 tick 加多少 atb，不能拿来当横坐标。
 */
export function atbFillRatio(atb: number, atbMax = ATB_MAX): number {
  if (!Number.isFinite(atb) || !Number.isFinite(atbMax) || atbMax <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, atb / atbMax));
}

/** 小头像横坐标。0 在起点，1 在终点。参数里没有速度。 */
export function speedBarIconX(trackLeft: number, trackSpan: number, atb: number, atbMax = ATB_MAX): number {
  return trackLeft + trackSpan * atbFillRatio(atb, atbMax);
}

export function preloadPresentation(scene: {
  load: { image: (key: string, url: string) => void };
}): void {
  for (const file of PRESENTATION_FILES) {
    scene.load.image(file.key, file.path);
  }
}
