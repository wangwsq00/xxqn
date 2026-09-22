import { ATB_MAX } from "../combat/constants";
import { PORTRAIT } from "./portraits";

/**
 * M2 表现层切图。逻辑 id 跟 `docs/M1_presentation_v2.md` §3.4。
 * 官方路径在仓库里时优先；没有则回退到先前的图标和法阵。不参与数值。
 */

export const UI_ICON = {
  dongfu: "icon_tab_dongfu",
  trial: "icon_tab_trial",
  cultivate: "icon_tab_cultivate",
} as const;

export const UI_ICON_ON = {
  dongfu: "icon_tab_dongfu_on",
  trial: "icon_tab_trial_on",
  cultivate: "icon_tab_cultivate_on",
} as const;

export const SPIRIT_ARRAY = {
  low: "fx_array_low",
  mid: "fx_array_mid",
  high: "fx_array_high",
} as const;

export const SKILL_FX = {
  swordqi: "fx_skill_swordqi",
  fireball: "fx_skill_fireball",
  shockwave: "fx_skill_shockwave",
} as const;

/** 洞府打坐莲座全身像。头像和战斗仍用 player_hero。 */
export const HUB_MEDITATE = "hero_meditate";

/** 法阵中心。主角脚底仍是 (360, 780)，阵在人下面。 */
export const HUB_ARRAY_CENTER_X = 360;
export const HUB_ARRAY_CENTER_Y = 760;

/** 吸收粒子深度低于底栏，避免挡住洞府 / 试炼 / 养成。 */
export const HUB_ABSORB_DEPTH = 7;
export const HUB_DOCK_DEPTH = 100;

/** 关掉只停吸收动画，不改挂机产量。 */
export const ABSORB_FX_ENABLED = true;

/**
 * 莲座图显示高度。脚底仍是 portraits 里的 (360, 780)。
 * 比半身立绘略高，头顶留在修为条文案下面。
 */
export const HUB_MEDITATE_HEIGHT = 500;

export interface PresentationFile {
  key: string;
  path: string;
}

export interface PresentationCandidate {
  id: string;
  official: string;
  fallback?: string;
}

export const PRESENTATION_CANDIDATES: PresentationCandidate[] = [
  {
    id: UI_ICON.dongfu,
    official: "assets/ui/icons/icon_tab_dongfu.png",
    fallback: "assets/ui/icon_dongfu.png",
  },
  { id: UI_ICON_ON.dongfu, official: "assets/ui/icons/icon_tab_dongfu_on.png" },
  {
    id: UI_ICON.trial,
    official: "assets/ui/icons/icon_tab_trial.png",
    fallback: "assets/ui/icon_trial.png",
  },
  { id: UI_ICON_ON.trial, official: "assets/ui/icons/icon_tab_trial_on.png" },
  {
    id: UI_ICON.cultivate,
    official: "assets/ui/icons/icon_tab_cultivate.png",
    fallback: "assets/ui/icon_growth.png",
  },
  { id: UI_ICON_ON.cultivate, official: "assets/ui/icons/icon_tab_cultivate_on.png" },
  {
    id: SPIRIT_ARRAY.low,
    official: "assets/fx/array/fx_array_low.png",
    fallback: "assets/fx/array_tier1.png",
  },
  {
    id: SPIRIT_ARRAY.mid,
    official: "assets/fx/array/fx_array_mid.png",
    fallback: "assets/fx/array_tier2.png",
  },
  {
    id: SPIRIT_ARRAY.high,
    official: "assets/fx/array/fx_array_high.png",
    fallback: "assets/fx/array_tier3.png",
  },
  { id: SKILL_FX.swordqi, official: "assets/fx/skill/fx_skill_swordqi.png" },
  { id: SKILL_FX.fireball, official: "assets/fx/skill/fx_skill_fireball.png" },
  { id: SKILL_FX.shockwave, official: "assets/fx/skill/fx_skill_shockwave.png" },
  ...Object.values(PORTRAIT).map((portraitKey) => ({
    id: `avatar_${portraitKey}`,
    official: `assets/ui/avatar/avatar_${portraitKey}.png`,
  })),
  { id: HUB_MEDITATE, official: "assets/char/hero_meditate.png" },
];

export function shippedAssetPaths(keys: Iterable<string> = __XXQN_SHIPPED_ASSETS__): Set<string> {
  return new Set(keys);
}

/** 官方文件在清单里就用官方路径，否则用回退。两边都没有则不预加载。 */
export function resolvePresentationFile(
  candidate: PresentationCandidate,
  shipped: ReadonlySet<string>,
): PresentationFile | null {
  if (shipped.has(candidate.official)) {
    return { key: candidate.id, path: candidate.official };
  }
  if (candidate.fallback && shipped.has(candidate.fallback)) {
    return { key: candidate.id, path: candidate.fallback };
  }
  return null;
}

export function presentationFilesFrom(shipped: ReadonlySet<string>): PresentationFile[] {
  return PRESENTATION_CANDIDATES.flatMap((candidate) => {
    const file = resolvePresentationFile(candidate, shipped);
    return file ? [file] : [];
  });
}

export const PRESENTATION_FILES = presentationFilesFrom(shippedAssetPaths());

export function speedBarAvatarKey(portraitKey: string): string {
  return `avatar_${portraitKey}`;
}

/** 已知功法对应的技能特效键。没有对应切图时战斗仍用原来的光点和斩击。 */
export function skillFxTextureId(skillName: string): string | null {
  if (skillName === "七星剑阵") {
    return SKILL_FX.swordqi;
  }
  if (skillName === "天罡护体") {
    return SKILL_FX.shockwave;
  }
  if (skillName.includes("火球")) {
    return SKILL_FX.fireball;
  }
  return null;
}

export type ArrayTier = 1 | 2 | 3;

export interface SpiritArrayFx {
  /** 转一圈的毫秒数。阶越高转得越快。 */
  rotateMs: number;
  /** 法阵呼吸一轮。限制在 2.4–3.2 秒。 */
  breatheMs: number;
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
    return SPIRIT_ARRAY.low;
  }
  if (tier === 2) {
    return SPIRIT_ARRAY.mid;
  }
  return SPIRIT_ARRAY.high;
}

/**
 * 粒子在发射器本地坐标里的汇聚点。x = 0 是阵心，y 为负是往胸口收，不会往底栏冲。
 */
export function absorbMoveToLocal(arrayCenterY: number, chestY: number): { x: number; y: number } {
  return { x: 0, y: Math.min(-40, chestY - arrayCenterY) };
}

export function spiritArrayFx(tier: ArrayTier): SpiritArrayFx {
  if (tier === 1) {
    return {
      rotateMs: 22000,
      breatheMs: 3200,
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
      breatheMs: 2800,
      particleFrequency: 80,
      moteSpeed: 180,
      glowAlpha: 0.34,
      glowRadius: 98,
      alphaMin: 0.78,
    };
  }
  return {
    rotateMs: 11000,
    breatheMs: 2400,
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
