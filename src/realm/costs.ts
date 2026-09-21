import {
  BREAKTHROUGH_QI_CAP_RATIO,
  LAYER_COST_GROWTH,
  LIANQI_LAYER_1_TO_2_COST,
  MAJOR_REALMS,
  MINOR_LAYERS,
} from "./constants";

export function clampMajor(realmMajor: number): number {
  if (!Number.isFinite(realmMajor)) {
    return 1;
  }
  return Math.min(MAJOR_REALMS, Math.max(1, Math.floor(realmMajor)));
}

export function clampLayer(realmLayer: number): number {
  if (!Number.isFinite(realmLayer)) {
    return 1;
  }
  return Math.min(MINOR_LAYERS, Math.max(1, Math.floor(realmLayer)));
}

/**
 * 该大境界 1→2 层所需灵气。
 * 炼气 = 100；其后 = 上一大境界 8→9 层 × 2。
 */
export function majorFirstLayerCost(realmMajor: number): number {
  const major = clampMajor(realmMajor);
  if (major <= 1) {
    return LIANQI_LAYER_1_TO_2_COST;
  }
  return layerUpCost(major - 1, 8) * 2;
}

/**
 * 同一大境界内，从 `fromLayer` 升到下一小境界所需灵气（`fromLayer` 1–8）。
 * 公式：本境 1→2 成本 × 1.2^(层-1)。
 */
export function layerUpCost(realmMajor: number, fromLayer: number): number {
  const layer = Math.min(MINOR_LAYERS - 1, Math.max(1, Math.floor(fromLayer)));
  return majorFirstLayerCost(realmMajor) * LAYER_COST_GROWTH ** (layer - 1);
}

/** 九层「当前境界所需灵气」：8→9 再 ×1.2，用于突破阈值与上限。 */
export function breakthroughQiRequirement(realmMajor: number): number {
  return layerUpCost(realmMajor, 8) * LAYER_COST_GROWTH;
}

/** 当前层升层或九层突破所对照的灵气需求（100%）。 */
export function currentQiRequirement(realmMajor: number, realmLayer: number): number {
  const layer = clampLayer(realmLayer);
  if (layer >= MINOR_LAYERS) {
    return breakthroughQiRequirement(realmMajor);
  }
  return layerUpCost(realmMajor, layer);
}

/** 1–8 层上限 = 下一层消耗；9 层上限 = 突破需求 × 200%。 */
export function qiCap(realmMajor: number, realmLayer: number): number {
  const requirement = currentQiRequirement(realmMajor, realmLayer);
  if (clampLayer(realmLayer) >= MINOR_LAYERS) {
    return requirement * BREAKTHROUGH_QI_CAP_RATIO;
  }
  return requirement;
}

export function isPeakMinorLayer(realmLayer: number): boolean {
  return clampLayer(realmLayer) >= MINOR_LAYERS;
}
