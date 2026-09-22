/** 全幅背景。路径相对 Phaser loader baseURL（含 Pages 子路径）。 */

export const BACKDROP = {
  dongfu: "bg_dongfu",
  trial: "bg_trial",
  battle: "bg_battle",
} as const;

export type BackdropKey = (typeof BACKDROP)[keyof typeof BACKDROP];

export interface BackdropFile {
  key: BackdropKey;
  path: string;
  /** 0–1，横向取景中心。竖屏会裁掉横图两侧。 */
  focusX: number;
}

export const BACKDROP_FILES: BackdropFile[] = [
  { key: BACKDROP.dongfu, path: "assets/bg/bg_dongfu.png", focusX: 0.74 },
  { key: BACKDROP.trial, path: "assets/bg/bg_trial.png", focusX: 0.5 },
  { key: BACKDROP.battle, path: "assets/bg/bg_battle.png", focusX: 0.5 },
];

export function backdropFile(key: BackdropKey): BackdropFile {
  return BACKDROP_FILES.find((file) => file.key === key) ?? BACKDROP_FILES[0]!;
}

/** 把横图铺满逻辑帧，焦点决定裁切中心。 */
export function coverPlacement(
  frameW: number,
  frameH: number,
  srcW: number,
  srcH: number,
  focusX: number,
  focusY = 0.5,
): { scale: number; x: number; y: number } {
  const scale = Math.max(frameW / srcW, frameH / srcH);
  const dispW = srcW * scale;
  const dispH = srcH * scale;
  return {
    scale,
    x: frameW / 2 - (focusX - 0.5) * dispW,
    y: frameH / 2 - (focusY - 0.5) * dispH,
  };
}
