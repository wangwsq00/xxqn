import Phaser from "phaser";

const MOTE_KEY = "m2-mote";

function asCanvasSource(image: HTMLImageElement | HTMLCanvasElement | Phaser.GameObjects.RenderTexture): CanvasImageSource | null {
  if (typeof HTMLImageElement !== "undefined" && image instanceof HTMLImageElement) {
    return image;
  }
  if (typeof HTMLCanvasElement !== "undefined" && image instanceof HTMLCanvasElement) {
    return image;
  }
  return null;
}

function sourceSize(source: CanvasImageSource): { width: number; height: number } {
  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
    return { width: source.naturalWidth || source.width, height: source.naturalHeight || source.height };
  }
  if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
    return { width: source.width, height: source.height };
  }
  const box = source as { width?: number; height?: number };
  return { width: box.width ?? 0, height: box.height ?? 0 };
}

function paintCanvas(
  scene: Phaser.Scene,
  outKey: string,
  size: number,
  draw: (ctx: CanvasRenderingContext2D, source: CanvasImageSource, sw: number, sh: number) => void,
  sourceKey: string,
): string | null {
  if (scene.textures.exists(outKey)) {
    return outKey;
  }
  if (!scene.textures.exists(sourceKey)) {
    return null;
  }
  const source = asCanvasSource(scene.textures.get(sourceKey).getSourceImage());
  if (!source) {
    return null;
  }
  const { width, height } = sourceSize(source);
  if (width <= 0 || height <= 0) {
    return null;
  }
  const canvas = scene.textures.createCanvas(outKey, size, size);
  if (!canvas) {
    return null;
  }
  draw(canvas.getContext(), source, width, height);
  canvas.refresh();
  return outKey;
}

/**
 * 方图立绘软晕边。没有透明通道时拿掉硬边方框，底中锚点仍由调用方设 origin(0.5, 1)。
 */
export function ensureSoftBody(scene: Phaser.Scene, sourceKey: string, size: number): string | null {
  const outKey = `m2-body-${sourceKey}-${size}`;
  return paintCanvas(scene, outKey, size, (ctx, source) => {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(source, 0, 0, size, size);
    ctx.globalCompositeOperation = "destination-in";
    const glow = ctx.createRadialGradient(size * 0.5, size * 0.46, size * 0.2, size * 0.5, size * 0.48, size * 0.54);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.58, "rgba(255,255,255,0.96)");
    glow.addColorStop(0.8, "rgba(255,255,255,0.42)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, size, size);
  }, sourceKey);
}

/** 圆形头像，取立绘上半张的脸。 */
export function ensureFaceDisc(scene: Phaser.Scene, sourceKey: string, size: number): string | null {
  const outKey = `m2-face-${sourceKey}-${size}`;
  return paintCanvas(scene, outKey, size, (ctx, source, sw, sh) => {
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const crop = sw * 0.46;
    const sx = (sw - crop) / 2;
    const sy = sh * 0.04;
    ctx.drawImage(source, sx, sy, crop, crop, 0, 0, size, size);
    ctx.restore();
  }, sourceKey);
}

export function ensureMote(scene: Phaser.Scene): string {
  if (scene.textures.exists(MOTE_KEY)) {
    return MOTE_KEY;
  }
  const size = 32;
  const canvas = scene.textures.createCanvas(MOTE_KEY, size, size);
  if (!canvas) {
    return MOTE_KEY;
  }
  const ctx = canvas.getContext();
  const glow = ctx.createRadialGradient(16, 16, 1, 16, 16, 16);
  glow.addColorStop(0, "rgba(232,255,252,1)");
  glow.addColorStop(0.35, "rgba(120,232,224,0.9)");
  glow.addColorStop(1, "rgba(58,168,160,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);
  canvas.refresh();
  return MOTE_KEY;
}
