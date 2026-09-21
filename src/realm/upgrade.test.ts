import { describe, expect, it } from "vitest";
import { defaultSave } from "../save/storage";
import { LIANQI_LAYER_1_TO_2_COST } from "./constants";
import {
  breakthroughQiRequirement,
  currentQiRequirement,
  layerUpCost,
  majorFirstLayerCost,
  qiCap,
} from "./costs";
import { applyMinorLayerUps } from "./upgrade";
import { claimIdle } from "../idle/settle";

function withQi(lingqi: number, layer = 1, major = 1) {
  const save = defaultSave(0);
  return {
    ...save,
    player: {
      ...save.player,
      realmMajor: major,
      realmLayer: layer,
      lingqi,
    },
  };
}

describe("layer costs", () => {
  it("follows 炼气 1→2 = 100 and ×1.2 per small layer", () => {
    expect(layerUpCost(1, 1)).toBe(LIANQI_LAYER_1_TO_2_COST);
    expect(layerUpCost(1, 2)).toBeCloseTo(120);
    expect(layerUpCost(1, 3)).toBeCloseTo(144);
    expect(layerUpCost(1, 8)).toBeCloseTo(100 * 1.2 ** 7);
  });

  it("sets the next major 1→2 cost to previous 8→9 × 2", () => {
    expect(majorFirstLayerCost(2)).toBeCloseTo(layerUpCost(1, 8) * 2);
    expect(layerUpCost(2, 1)).toBeCloseTo(layerUpCost(1, 8) * 2);
  });

  it("caps 1–8 at 100% of the next layer and 9 at 200% of breakthrough qi", () => {
    expect(qiCap(1, 1)).toBe(100);
    expect(currentQiRequirement(1, 9)).toBeCloseTo(breakthroughQiRequirement(1));
    expect(qiCap(1, 9)).toBeCloseTo(breakthroughQiRequirement(1) * 2);
  });
});

describe("applyMinorLayerUps", () => {
  it("does nothing below the first layer cost", () => {
    const result = applyMinorLayerUps(withQi(99));
    expect(result.layersGained).toBe(0);
    expect(result.save.player.realmLayer).toBe(1);
    expect(result.save.player.lingqi).toBe(99);
  });

  it("auto-applies 炼气 1→2 and clears the spent qi", () => {
    const result = applyMinorLayerUps(withQi(100));
    expect(result.layersGained).toBe(1);
    expect(result.save.player.realmMajor).toBe(1);
    expect(result.save.player.realmLayer).toBe(2);
    expect(result.save.player.lingqi).toBeCloseTo(0);
    expect(result.fromLayer).toBe(1);
    expect(result.toLayer).toBe(2);
  });

  it("chains multiple small-layer ups in one apply", () => {
    const result = applyMinorLayerUps(withQi(100 + 120 + 144 + 30));
    expect(result.layersGained).toBe(3);
    expect(result.save.player.realmLayer).toBe(4);
    expect(result.save.player.lingqi).toBeCloseTo(30);
  });

  it("stops at 炼气九层 and does not break through to 筑基", () => {
    const toPeak = 100 * ((1.2 ** 8 - 1) / 0.2);
    const result = applyMinorLayerUps(withQi(toPeak + 50_000));
    expect(result.save.player.realmMajor).toBe(1);
    expect(result.save.player.realmLayer).toBe(9);
    expect(result.save.player.lingqi).toBeCloseTo(qiCap(1, 9));
    expect(result.save.player.lingqi).toBeLessThanOrEqual(qiCap(1, 9) + 1e-6);
  });

  it("applies after claiming enough idle lingqi", () => {
    const t0 = 1_000_000;
    const claimed = claimIdle(defaultSave(t0), t0 + 100_000);
    expect(claimed.save.player.lingqi).toBe(100);
    expect(claimed.save.player.realmLayer).toBe(1);
    const cultivated = applyMinorLayerUps(claimed.save);
    expect(cultivated.layersGained).toBe(1);
    expect(cultivated.save.player.realmLayer).toBe(2);
    expect(cultivated.save.player.lingqi).toBeCloseTo(0);
  });
});
