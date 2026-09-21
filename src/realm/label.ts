import { clampLayer, clampMajor } from "./costs";

export const MAJOR_NAMES = [
  "炼气境",
  "筑基境",
  "金丹境",
  "元婴境",
  "化神境",
  "炼虚境",
  "合体境",
  "大乘境",
  "渡劫境",
] as const;

export const LAYER_NAMES = ["一", "二", "三", "四", "五", "六", "七", "八", "九"] as const;

export function realmLabel(major: number, layer: number): string {
  const name = MAJOR_NAMES[clampMajor(major) - 1] ?? "炼气境";
  const layerName = LAYER_NAMES[clampLayer(layer) - 1] ?? "一";
  return `${name}${layerName}层`;
}
