import Phaser from "phaser";
import { speedBarAvatarKey, speedBarIconX } from "../assets/presentation";
import { compareReady } from "../combat/engine";
import type { Combatant } from "../combat/types";
import { hasPortrait } from "./portraitView";
import { ensureFaceDisc } from "./softPortrait";
import { PALETTE } from "./theme";

interface SpeedIcon {
  root: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  side: Combatant["side"];
}

const ICON = 34;

/**
 * 一条共用行动条。小头像 X = atb / ATB_MAX。
 * 出手后引擎把 atb 设为 0，图标跟着回到起点，不另做计时，也不用速度当坐标。
 * 同一帧堆在终点时，层次用 `compareReady`（速度高、槽位小、我方在前）。
 */
export class SharedSpeedBar {
  private readonly icons = new Map<string, SpeedIcon>();
  private readonly trackLeft: number;
  private readonly trackSpan: number;
  private readonly y: number;

  constructor(scene: Phaser.Scene, y: number) {
    this.y = y;
    const width = scene.scale.width;
    const left = 24;
    const right = width - 24;
    const iconR = ICON / 2;
    this.trackLeft = left + iconR + 4;
    this.trackSpan = Math.max(1, right - left - ICON - 8);

    const g = scene.add.graphics().setDepth(54);
    g.fillStyle(PALETTE.ink, 0.88);
    g.fillRoundedRect(left, y - 11, right - left, 22, 11);
    g.lineStyle(2, PALETTE.gold, 0.95);
    g.strokeRoundedRect(left + 1, y - 10, right - left - 2, 20, 10);
    g.lineStyle(3, PALETTE.cinnabar, 1);
    g.lineBetween(right - 10, y - 16, right - 10, y + 16);
  }

  sync(scene: Phaser.Scene, units: Combatant[], actingId?: string | null): void {
    const living = units.filter((unit) => unit.alive);
    const livingIds = new Set(living.map((unit) => unit.id));
    for (const [id, icon] of this.icons) {
      if (!livingIds.has(id)) {
        scene.tweens.killTweensOf(icon.root);
        this.icons.delete(id);
        scene.tweens.add({
          targets: icon.root,
          alpha: 0,
          duration: 180,
          onComplete: () => icon.root.destroy(),
        });
      }
    }

    const pile = [...living].sort(compareReady);
    const depthOf = new Map(pile.map((unit, index) => [unit.id, 56 + pile.length - index]));

    for (const unit of living) {
      const acting = unit.id === actingId;
      const x = speedBarIconX(this.trackLeft, this.trackSpan, unit.atb);
      let icon = this.icons.get(unit.id);
      if (!icon) {
        icon = this.createIcon(scene, unit);
        this.icons.set(unit.id, icon);
      }
      icon.root.x = x;
      icon.root.y = this.y;
      this.paintRing(icon, acting);
      icon.root.setScale(acting ? 1.22 : 1);
      icon.root.setDepth(depthOf.get(unit.id) ?? 56);
    }
  }

  private createIcon(scene: Phaser.Scene, unit: Combatant): SpeedIcon {
    const root = scene.add.container(this.trackLeft, this.y).setDepth(56);
    const avatarKey = unit.portraitKey ? speedBarAvatarKey(unit.portraitKey) : "";
    const faceKey =
      avatarKey && scene.textures.exists(avatarKey)
        ? avatarKey
        : unit.portraitKey && hasPortrait(scene, unit.portraitKey)
          ? ensureFaceDisc(scene, unit.portraitKey, 64)
          : null;
    if (faceKey && scene.textures.exists(faceKey)) {
      root.add(scene.add.image(0, 0, faceKey).setDisplaySize(ICON - 4, ICON - 4));
    } else {
      root.add(
        scene.add.circle(0, 0, (ICON - 4) / 2, unit.side === "ally" ? PALETTE.cyan : PALETTE.cinnabar),
      );
    }
    const ring = scene.add.graphics();
    root.add(ring);
    const icon: SpeedIcon = { root, ring, side: unit.side };
    this.paintRing(icon, false);
    return icon;
  }

  private paintRing(icon: SpeedIcon, acting: boolean): void {
    let color: number = PALETTE.cinnabar;
    if (acting) {
      color = PALETTE.gold;
    } else if (icon.side === "ally") {
      color = PALETTE.cyan;
    }
    icon.ring.clear();
    icon.ring.lineStyle(acting ? 4 : 2, color, 1);
    icon.ring.strokeCircle(0, 0, ICON / 2);
    if (acting) {
      icon.ring.lineStyle(2, PALETTE.parchment, 0.9);
      icon.ring.strokeCircle(0, 0, ICON / 2 + 4);
    }
  }
}
