import Phaser from "phaser";
import type { ButtonTone } from "./chrome";
import { FONT, GOLD_HEX, PALETTE, PARCHMENT_HEX } from "./theme";

export interface IconTab {
  root: Phaser.GameObjects.Container;
  setTone: (tone: ButtonTone) => void;
  setLabel: (label: string) => void;
}

/**
 * 底栏一项：图标在上，短标签在下。选中为朱砂底、赤金描边，不是纯文字砖。
 * `height` 即点击热区，调用方应传入 ≥ 88。
 */
export function makeIconTab(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  iconKey: string,
  onClick: () => void,
  options?: { tone?: ButtonTone; depth?: number },
): IconTab {
  const root = scene.add.container(x, y);
  if (options?.depth !== undefined) {
    root.setDepth(options.depth);
  }
  const tone: { current: ButtonTone } = { current: options?.tone ?? "quiet" };
  const bg = scene.add.graphics();
  const ring = scene.add.graphics();
  const iconY = -16;
  const icon = scene.textures.exists(iconKey)
    ? scene.add.image(0, iconY, iconKey).setDisplaySize(64, 64)
    : null;
  const text = scene.add
    .text(0, 40, label, {
      fontFamily: FONT,
      fontSize: "22px",
      color: PARCHMENT_HEX,
    })
    .setOrigin(0.5);
  const hit = scene.add
    .rectangle(0, 0, width, height, PALETTE.ink, 0.001)
    .setInteractive({ useHandCursor: true });
  root.add([bg, ring]);
  if (icon) {
    root.add(icon);
  }
  root.add([text, hit]);

  const paint = () => {
    const selected = tone.current === "cinnabar";
    bg.clear();
    bg.fillStyle(selected ? PALETTE.cinnabar : PALETTE.ink, selected ? 1 : 0.45);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 18);
    bg.lineStyle(selected ? 3 : 2, PALETTE.gold, selected ? 1 : 0.55);
    bg.strokeRoundedRect(-width / 2 + 1, -height / 2 + 1, width - 2, height - 2, 18);
    ring.clear();
    if (selected) {
      ring.lineStyle(3, PALETTE.gold, 1);
      ring.strokeCircle(0, iconY, 34);
    }
    text.setColor(selected ? GOLD_HEX : PARCHMENT_HEX);
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
    setLabel: (value: string) => text.setText(value),
    setTone: (next: ButtonTone) => {
      tone.current = next;
      paint();
    },
  };
}
