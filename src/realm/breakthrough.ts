import type { SaveData } from "../save/types";
import {
  BREAKTHROUGH_QI_READY_RATIO,
  MAJOR_REALMS,
  MINOR_LAYERS,
} from "./constants";
import { breakthroughQiRequirement, clampLayer, clampMajor } from "./costs";
import { MAJOR_NAMES } from "./label";

const QI_EPS = 1e-9;

export interface BreakthroughResult {
  save: SaveData;
  succeeded: boolean;
  fromMajor: number;
  fromLayer: number;
  toMajor: number;
  toLayer: number;
}

export function nextMajorName(realmMajor: number): string | null {
  const major = clampMajor(realmMajor);
  if (major >= MAJOR_REALMS) {
    return null;
  }
  return MAJOR_NAMES[major] ?? null;
}

/** 九层且灵气达突破需求 100%，且未到渡劫顶。 */
export function canChallengeHeartDemon(save: SaveData): boolean {
  const major = clampMajor(save.player.realmMajor);
  const layer = clampLayer(save.player.realmLayer);
  if (layer < MINOR_LAYERS || major >= MAJOR_REALMS) {
    return false;
  }
  const need = breakthroughQiRequirement(major) * BREAKTHROUGH_QI_READY_RATIO;
  return save.player.lingqi + QI_EPS >= need;
}

export function heartDemonHint(save: SaveData): string {
  const layer = clampLayer(save.player.realmLayer);
  if (layer < MINOR_LAYERS) {
    return "";
  }
  const major = clampMajor(save.player.realmMajor);
  const next = nextMajorName(major);
  if (!next) {
    return "已至渡劫境九层，无法再破大境";
  }
  if (!canChallengeHeartDemon(save)) {
    return `灵气达 100% 后可挑战心魔，破境进入${next}`;
  }
  return `战胜心魔即可破境进入${next}一层`;
}

/**
 * 心魔战胜利：直接进入下一大境一层并清零灵气。
 * M1 把文档两阶段（心魔战 + 成功率掷骰）收成一战；不掷 50%、不用丹、不加资质。
 */
export function applyHeartDemonVictory(save: SaveData): BreakthroughResult {
  const fromMajor = clampMajor(save.player.realmMajor);
  const fromLayer = clampLayer(save.player.realmLayer);
  if (!canChallengeHeartDemon(save)) {
    return {
      save,
      succeeded: false,
      fromMajor,
      fromLayer,
      toMajor: fromMajor,
      toLayer: fromLayer,
    };
  }
  const toMajor = fromMajor + 1;
  return {
    save: {
      ...save,
      player: {
        ...save.player,
        realmMajor: toMajor,
        realmLayer: 1,
        lingqi: 0,
      },
    },
    succeeded: true,
    fromMajor,
    fromLayer,
    toMajor,
    toLayer: 1,
  };
}

/** 心魔战失败：不扣灵气、不改境界，可立即再战（M1 软重试）。 */
export function applyHeartDemonDefeat(save: SaveData): BreakthroughResult {
  const fromMajor = clampMajor(save.player.realmMajor);
  const fromLayer = clampLayer(save.player.realmLayer);
  return {
    save,
    succeeded: false,
    fromMajor,
    fromLayer,
    toMajor: fromMajor,
    toLayer: fromLayer,
  };
}
