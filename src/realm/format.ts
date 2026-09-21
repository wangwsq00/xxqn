import { trimRate } from "../idle/settle";
import { currentQiRequirement, isPeakMinorLayer, qiCap } from "./costs";
import { realmLabel } from "./label";

export function formatQiAmount(value: number): string {
  return trimRate(Math.round(value * 100) / 100);
}

export function cultivationProgressText(major: number, layer: number, lingqi: number): string {
  const have = Math.floor(lingqi);
  const need = currentQiRequirement(major, layer);
  if (isPeakMinorLayer(layer)) {
    return `突破灵气 ${have} / ${formatQiAmount(need)}（上限 ${formatQiAmount(qiCap(major, layer))}）`;
  }
  return `修为 ${have} / ${formatQiAmount(need)}  ·  升至${realmLabel(major, layer + 1)}`;
}

export function cultivationRatio(major: number, layer: number, lingqi: number): number {
  const need = currentQiRequirement(major, layer);
  if (need <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(1, lingqi / need));
}
