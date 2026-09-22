import Phaser from "phaser";
import { atbFillRatio } from "../assets/presentation";
import { hasPortrait } from "./portraitView";
import { ensureFaceDisc } from "./softPortrait";
import { PALETTE } from "./theme";

export interface SpeedBarEntry {
  id: string;
  side: "ally" | "enemy";
  atb: number;
  alive: boolean;
  portraitKey?: string;
}

interface SpeedIcon {
  root: Phaser.GameObjects.Container;
  ring: Phaser.GameObjects.Graphics;
  side: SpeedBarEntry["side"];
}

const ICON = 34;

/**
 * 一条共用行动条。图标横坐标只读战斗单位当前 `atb`。
 * `actingId` 把刚出手的单位钉在终点（引擎在同一 tick 已把 atb 清零），
 * 动画结束后再按真实 0 跳回起点，避免倒着滑回去。
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

  sync(scene: Phaser.Scene, units: SpeedBarEntry[], actingId?: string | null): void {
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

    for (const unit of living) {
      const acting = unit.id === actingId;
      const ratio = acting ? 1 : atbFillRatio(unit.atb);
      const x = this.trackLeft + ratio * this.trackSpan;
      let icon = this.icons.get(unit.id);
      const born = !icon;
      if (!icon) {
        icon = this.createIcon(scene, unit);
        icon.root.x = x;
        this.icons.set(unit.id, icon);
      }
      icon.root.y = this.y;
      if (!born) {
        if (x + 20 < icon.root.x) {
          scene.tweens.killTweensOf(icon.root);
          icon.root.x = x;
        } else if (Math.abs(x - icon.root.x) > 0.5) {
          scene.tweens.killTweensOf(icon.root);
          scene.tweens.add({
            targets: icon.root,
            x,
            duration: 90,
            ease: "Linear",
          });
        }
      }
      this.paintRing(icon, acting);
      icon.root.setScale(acting ? 1.22 : 1);
      icon.root.setDepth(56 + Math.round(ratio * 6) + (acting ? 4 : 0));
    }
  }

  private createIcon(scene: Phaser.Scene, unit: SpeedBarEntry): SpeedIcon {
    const root = scene.add.container(this.trackLeft, this.y).setDepth(56);
    const faceKey =
      unit.portraitKey && hasPortrait(scene, unit.portraitKey)
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
