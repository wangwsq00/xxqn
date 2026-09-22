import Phaser from "phaser";
import { PORTRAIT_FILES } from "../assets/portraits";
import { PALETTE } from "./theme";

export function preloadPortraits(scene: Phaser.Scene): void {
  for (const file of PORTRAIT_FILES) {
    scene.load.image(file.key, file.path);
  }
}

export function hasPortrait(scene: Phaser.Scene, key: string | undefined): key is string {
  return typeof key === "string" && key.length > 0 && scene.textures.exists(key);
}

/** 方形立绘。战斗槽用底中锚点（origin 0.5, 1）；洞府/列表框内仍可居中。 */
export function addPortrait(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  size: number,
  origin: { x: number; y: number } = { x: 0.5, y: 0.5 },
): Phaser.GameObjects.Image {
  const image = scene.add.image(x, y, key);
  image.setOrigin(origin.x, origin.y);
  image.setDisplaySize(size, size);
  return image;
}

export function addFramedPortrait(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string | undefined,
  size: number,
  options?: { stroke?: number; fill?: number },
): { frame: Phaser.GameObjects.Rectangle; portrait?: Phaser.GameObjects.Image } {
  const frameSize = size + 10;
  const frame = scene.add
    .rectangle(x, y, frameSize, frameSize, options?.fill ?? PALETTE.ink)
    .setStrokeStyle(2, options?.stroke ?? PALETTE.gold);
  if (!hasPortrait(scene, key)) {
    return { frame };
  }
  return { frame, portrait: addPortrait(scene, x, y, key, size) };
}

/** 底中锚点立绘牌。feetY 是画像底边，不是牌面外框。 */
export function addStandingPlate(
  scene: Phaser.Scene,
  x: number,
  feetY: number,
  key: string | undefined,
  height: number,
  options?: { depth?: number; stroke?: number },
): { frame: Phaser.GameObjects.Rectangle; portrait?: Phaser.GameObjects.Image } {
  const depth = options?.depth ?? 4;
  const frame = scene.add
    .rectangle(x, feetY + 8, height + 16, height + 16, PALETTE.ink, 1)
    .setOrigin(0.5, 1)
    .setStrokeStyle(3, options?.stroke ?? PALETTE.gold);
  frame.setDepth(depth);
  if (!hasPortrait(scene, key)) {
    return { frame };
  }
  const portrait = addPortrait(scene, x, feetY, key, height, { x: 0.5, y: 1 });
  portrait.setDepth(depth + 1);
  return { frame, portrait };
}
