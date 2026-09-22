import Phaser from "phaser";
import { backdropFile, coverPlacement, type BackdropKey } from "../assets/backdrops";
import {
  BODY_HEX,
  COLORS,
  DOCK_HEIGHT,
  FONT,
  GOLD_HEX,
  PALETTE,
  PARCHMENT_HEX,
  STROKE_HEX,
  UI_BTN_PAD_Y,
} from "./theme";

export type ButtonTone = "cinnabar" | "gold" | "quiet";

export interface UiButton {
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  setLabel: (text: string) => void;
  setTone: (tone: ButtonTone) => void;
}

const TONE_STYLE: Record<ButtonTone, { fill: number; text: string; stroke: number }> = {
  cinnabar: { fill: PALETTE.cinnabar, text: GOLD_HEX, stroke: PALETTE.gold },
  gold: { fill: PALETTE.gold, text: STROKE_HEX, stroke: PALETTE.stroke },
  quiet: { fill: PALETTE.ink, text: PARCHMENT_HEX, stroke: PALETTE.gold },
};

const BUTTON_RADIUS = Math.min(16, UI_BTN_PAD_Y);

export function mountBackdrop(
  scene: Phaser.Scene,
  key: BackdropKey,
  options?: { top?: number; bottom?: number; scrim?: number },
): void {
  const { width, height } = scene.scale;
  scene.cameras.main.setBackgroundColor(COLORS.bg);
  const file = backdropFile(key);
  if (scene.textures.exists(file.key)) {
    const src = scene.textures.get(file.key).getSourceImage() as { width: number; height: number };
    const placed = coverPlacement(width, height, src.width, src.height, file.focusX, 0.5);
    scene.add.image(placed.x, placed.y, file.key).setScale(placed.scale).setDepth(-200);
  }
  const top = options?.top ?? 220;
  const bottom = options?.bottom ?? 380;
  addInkFade(scene, true, top, options?.scrim ?? 0.72);
  addInkFade(scene, false, bottom, options?.scrim ?? 0.82);
}

function addInkFade(scene: Phaser.Scene, fromTop: boolean, band: number, maxAlpha: number): void {
  const { width, height } = scene.scale;
  const steps = 8;
  const slice = band / steps;
  for (let i = 0; i < steps; i += 1) {
    const alpha = fromTop ? maxAlpha * (1 - i / steps) : maxAlpha * ((i + 1) / steps);
    const y = fromTop ? slice * i + slice / 2 : height - band + slice * i + slice / 2;
    scene.add.rectangle(width / 2, y, width + 2, slice + 1, PALETTE.ink, alpha).setDepth(-180);
  }
}

export function addPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.9,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(x, y, width, height, PALETTE.ink, alpha)
    .setStrokeStyle(2, PALETTE.gold);
}

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  onClick: () => void,
  options?: { tone?: ButtonTone; fontSize?: number; depth?: number; radius?: number },
): UiButton {
  const root = scene.add.container(x, y);
  if (options?.depth !== undefined) {
    root.setDepth(options.depth);
  }
  const tone: { current: ButtonTone } = { current: options?.tone ?? "gold" };
  const bg = scene.add.graphics();
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: `${options?.fontSize ?? 28}px`,
      color: TONE_STYLE[tone.current].text,
    })
    .setOrigin(0.5);
  const hit = scene.add
    .rectangle(0, 0, width, height, PALETTE.ink, 0.001)
    .setInteractive({ useHandCursor: true });
  root.add([bg, text, hit]);

  const paint = () => {
    const style = TONE_STYLE[tone.current];
    bg.clear();
    bg.fillStyle(style.fill, tone.current === "quiet" ? 0.92 : 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, options?.radius ?? BUTTON_RADIUS);
    bg.lineStyle(2, style.stroke, 1);
    bg.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, options?.radius ?? BUTTON_RADIUS);
    text.setColor(style.text);
  };
  paint();

  hit.on("pointerdown", () => {
    root.setScale(0.97);
    onClick();
    if (root.active && scene.sys.isActive()) {
      scene.tweens.add({
        targets: root,
        scaleX: 1,
        scaleY: 1,
        duration: 90,
        ease: "Quad.easeOut",
      });
    }
  });

  return {
    root,
    bg: hit,
    label: text,
    setLabel: (value: string) => text.setText(value),
    setTone: (next: ButtonTone) => {
      tone.current = next;
      paint();
    },
  };
}

export function makeChip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  depth = 30,
): Phaser.GameObjects.Text {
  const root = scene.add.container(x, y).setDepth(depth);
  const bg = scene.add.graphics();
  bg.fillStyle(PALETTE.ink, 0.88);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, 14);
  bg.lineStyle(2, PALETTE.gold, 1);
  bg.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 14);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: FONT,
      fontSize: "22px",
      color: BODY_HEX,
    })
    .setOrigin(0.5);
  root.add([bg, text]);
  return text;
}

export function tweenBar(
  scene: Phaser.Scene,
  bar: Phaser.GameObjects.Rectangle,
  ratio: number,
  duration = 140,
): void {
  const scaleX = Math.max(0, Math.min(1, ratio));
  scene.tweens.killTweensOf(bar);
  scene.tweens.add({
    targets: bar,
    scaleX,
    duration,
    ease: "Quad.easeOut",
  });
}

export function addLockGlyph(scene: Phaser.Scene, x: number, y: number, depth = 8): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  g.lineStyle(4, PALETTE.gold, 1);
  g.beginPath();
  g.arc(x, y - 10, 14, Math.PI, 0, false);
  g.strokePath();
  g.fillStyle(PALETTE.gold, 1);
  g.fillRoundedRect(x - 18, y - 8, 36, 30, 5);
  g.fillStyle(PALETTE.cinnabar, 1);
  g.fillCircle(x, y + 6, 3);
  return g;
}

export const DOCK = {
  height: DOCK_HEIGHT,
} as const;

export function dockTop(scene: Phaser.Scene): number {
  return scene.scale.height - DOCK_HEIGHT;
}

export const BUTTON_TEXT = {
  onCinnabar: GOLD_HEX,
  onGold: STROKE_HEX,
  quiet: PARCHMENT_HEX,
  body: BODY_HEX,
} as const;
