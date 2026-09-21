import type { SaveData } from "../save/types";
import { MINOR_LAYERS } from "./constants";
import { clampLayer, clampMajor, layerUpCost, qiCap } from "./costs";

export interface CultivationResult {
  save: SaveData;
  layersGained: number;
  fromMajor: number;
  fromLayer: number;
  toMajor: number;
  toLayer: number;
  spentLingqi: number;
}

const QI_EPS = 1e-9;

/**
 * 用已入账灵气自动升小境界（同一大境内 1–9 层）。
 * 达 9 层后不再破大境；剩余灵气按文档上限截断。
 */
export function applyMinorLayerUps(save: SaveData): CultivationResult {
  const fromMajor = clampMajor(save.player.realmMajor);
  const fromLayer = clampLayer(save.player.realmLayer);
  let major = fromMajor;
  let layer = fromLayer;
  let qi = Math.max(0, save.player.lingqi);
  let spentLingqi = 0;
  let layersGained = 0;

  while (layer < MINOR_LAYERS) {
    const cost = layerUpCost(major, layer);
    if (qi + QI_EPS < cost) {
      break;
    }
    qi -= cost;
    spentLingqi += cost;
    layer += 1;
    layersGained += 1;
  }

  const cap = qiCap(major, layer);
  if (qi > cap) {
    qi = cap;
  }

  return {
    save: {
      ...save,
      player: {
        ...save.player,
        realmMajor: major,
        realmLayer: layer,
        lingqi: qi,
      },
    },
    layersGained,
    fromMajor,
    fromLayer,
    toMajor: major,
    toLayer: layer,
    spentLingqi,
  };
}
