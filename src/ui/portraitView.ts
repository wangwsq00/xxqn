import Phaser from "phaser";
import { PORTRAIT_FILES } from "../assets/portraits";

export function preloadPortraits(scene: Phaser.Scene): void {
  for (const file of PORTRAIT_FILES) {
    scene.load.image(file.key, file.path);
  }
}

export function hasPortrait(scene: Phaser.Scene, key: string | undefined): key is string {
  return typeof key === "string" && key.length > 0 && scene.textures.exists(key);
}

/** 方形立绘；源图已裁成 512²，按槽位边长显示，避免拉伸。 */
export function addPortrait(
  scene: Phaser.Scene,
  x: number,
  y: number,
  key: string,
  size: number,
): Phaser.GameObjects.Image {
  const image = scene.add.image(x, y, key);
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
    .rectangle(x, y, frameSize, frameSize, options?.fill ?? 0x14101c)
    .setStrokeStyle(2, options?.stroke ?? 0xc9a227);
  if (!hasPortrait(scene, key)) {
    return { frame };
  }
  return { frame, portrait: addPortrait(scene, x, y, key, size) };
}
