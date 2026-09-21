import Phaser from "phaser";
import { ATB_MAX, SLOT_ORDER_TOP_TO_BOTTOM, TICK_MS } from "../combat/constants";
import { createTrialEncounter } from "../combat/encounter";
import { BattleEngine } from "../combat/engine";
import type { ActionResult, Combatant, SlotIndex } from "../combat/types";
import { COLORS, FONT } from "../ui/theme";

interface SlotView {
  slot: SlotIndex;
  side: Combatant["side"];
  rootX: number;
  rootY: number;
  body: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  atbBarBg: Phaser.GameObjects.Rectangle;
  atbBar: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
}

const CARD_W = 148;
const CARD_H = 118;
const BAR_W = 120;

export class BattleScene extends Phaser.Scene {
  private engine!: BattleEngine;
  private views = new Map<string, SlotView>();
  private slotViews: SlotView[] = [];
  private logText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private animating = false;
  private tickCarry = 0;
  private ended = false;

  constructor() {
    super("Battle");
  }

  create(): void {
    this.engine = new BattleEngine(createTrialEncounter());
    this.views.clear();
    this.slotViews = [];
    this.animating = false;
    this.tickCarry = 0;
    this.ended = false;

    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, 48, "试炼战斗", {
        fontFamily: FONT,
        fontSize: "36px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 90, "行动条自动战斗 · 位置 4-2-1-3-5 · 主角居中", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add
      .text(118, 128, "我方", {
        fontFamily: FONT,
        fontSize: "20px",
        color: "#7ec8e3",
      })
      .setOrigin(0.5);

    this.add
      .text(width - 118, 128, "敌方", {
        fontFamily: FONT,
        fontSize: "20px",
        color: "#e08080",
      })
      .setOrigin(0.5);

    const startY = 188;
    const gap = 132;
    SLOT_ORDER_TOP_TO_BOTTOM.forEach((slot, index) => {
      const y = startY + index * gap;
      this.drawSlot("ally", slot, 150, y);
      this.drawSlot("enemy", slot, width - 150, y);
    });

    this.add.rectangle(width / 2, 980, 640, 160, COLORS.panel).setStrokeStyle(1, COLORS.panelStroke);
    this.logText = this.add
      .text(70, 910, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.log,
        lineSpacing: 6,
        wordWrap: { width: 580 },
      })
      .setOrigin(0, 0);

    this.statusText = this.add
      .text(width / 2, 1090, "行动条充能中…", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.makeButton(width / 2, 1168, "返回洞府", () => this.scene.start("Hub"));
    this.refreshViews();
    this.refreshLog();
  }

  update(_time: number, delta: number): void {
    if (this.ended || this.animating) {
      return;
    }
    this.tickCarry += delta;
    while (this.tickCarry >= TICK_MS && !this.animating && !this.ended) {
      this.tickCarry -= TICK_MS;
      const action = this.engine.tick();
      this.refreshViews();
      if (action) {
        this.playAction(action);
        break;
      }
    }
  }

  private drawSlot(side: Combatant["side"], slot: SlotIndex, x: number, y: number): void {
    const unit = this.engine.units.find((item) => item.side === side && item.slot === slot);
    const fill = unit ? (unit.isHero ? COLORS.hero : side === "ally" ? COLORS.ally : COLORS.enemy) : COLORS.empty;
    const body = this.add.rectangle(x, y, CARD_W, CARD_H, fill, unit ? 1 : 0.35);
    body.setStrokeStyle(2, unit?.isHero ? 0xfff3c4 : 0x5a5478);

    const label = unit ? unit.name : `空位 ${slot}`;
    const nameText = this.add
      .text(x, y - 38, slot === 1 && side === "ally" && unit?.isHero ? `${label} · 中` : `${label} · ${slot}`, {
        fontFamily: FONT,
        fontSize: "16px",
        color: unit ? COLORS.text : COLORS.muted,
      })
      .setOrigin(0.5);

    const hpBarBg = this.add.rectangle(x, y + 8, BAR_W, 10, COLORS.hpBg);
    const hpBar = this.add.rectangle(x - BAR_W / 2, y + 8, BAR_W, 10, COLORS.hp).setOrigin(0, 0.5);
    const atbBarBg = this.add.rectangle(x, y + 24, BAR_W, 8, COLORS.atbBg);
    const atbBar = this.add.rectangle(x - BAR_W / 2, y + 24, BAR_W, 8, COLORS.atb).setOrigin(0, 0.5);
    const hpText = this.add
      .text(x, y + 44, unit ? `${unit.stats.hp}/${unit.stats.maxHp}` : "—", {
        fontFamily: FONT,
        fontSize: "14px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    const view: SlotView = {
      slot,
      side,
      rootX: x,
      rootY: y,
      body,
      nameText,
      hpBarBg,
      hpBar,
      atbBarBg,
      atbBar,
      hpText,
    };
    this.slotViews.push(view);
    if (unit) {
      this.views.set(unit.id, view);
    }
  }

  private refreshViews(): void {
    for (const view of this.slotViews) {
      const unit = this.engine.units.find((item) => item.side === view.side && item.slot === view.slot);
      if (!unit) {
        view.hpBar.scaleX = 0;
        view.atbBar.scaleX = 0;
        continue;
      }
      const hpRatio = unit.stats.maxHp <= 0 ? 0 : unit.stats.hp / unit.stats.maxHp;
      const atbRatio = unit.alive ? unit.atb / ATB_MAX : 0;
      view.hpBar.scaleX = Math.max(0, hpRatio);
      view.atbBar.scaleX = Math.max(0, Math.min(1, atbRatio));
      view.hpText.setText(unit.alive ? `${unit.stats.hp}/${unit.stats.maxHp}` : "阵亡");
      view.body.setAlpha(unit.alive ? 1 : 0.35);
    }
  }

  private refreshLog(): void {
    const lines = this.engine.log.slice(-5);
    this.logText?.setText(lines.join("\n") || "等待出手…");
  }

  private playAction(action: ActionResult): void {
    this.animating = true;
    this.refreshLog();
    const actor = this.engine.units.find((unit) => unit.id === action.actorId);
    const actorView = this.views.get(action.actorId);
    this.statusText?.setText(`${actor?.name ?? "单位"} 使用 ${action.skillName}`);

    if (actorView) {
      this.tweens.add({
        targets: actorView.body,
        scaleX: 1.08,
        scaleY: 1.08,
        yoyo: true,
        duration: 120,
      });
    }

    const floaters: { x: number; y: number; text: string; color: string; scale: number }[] = [];
    for (const target of action.targets) {
      const view = this.views.get(target.targetId);
      if (!view) {
        continue;
      }
      for (const segment of target.segments) {
        if (segment.trigger === "skip") {
          continue;
        }
        if (segment.trigger === "miss") {
          floaters.push({ x: view.rootX, y: view.rootY - 10, text: "闪避", color: COLORS.muted, scale: 1 });
        } else {
          const parts = [String(segment.damage)];
          if (segment.crit) {
            parts.unshift("暴击");
          }
          if (segment.blocked) {
            parts.push("格挡");
          }
          floaters.push({
            x: view.rootX,
            y: view.rootY - 10,
            text: parts.join(" "),
            color: segment.crit ? "#ffb347" : "#fff6d8",
            scale: segment.crit ? 1.25 : 1,
          });
        }
      }
    }

    const delay = 220;
    floaters.forEach((floater, index) => {
      this.time.delayedCall(index * delay, () => this.spawnFloater(floater));
    });
    const wait = Math.max(360, floaters.length * delay + 200);
    this.time.delayedCall(wait, () => {
      this.refreshViews();
      this.refreshLog();
      this.animating = false;
      if (this.engine.status !== "ongoing") {
        this.showOutcome();
      }
    });
  }

  private spawnFloater(floater: { x: number; y: number; text: string; color: string; scale: number }): void {
    const text = this.add
      .text(floater.x, floater.y, floater.text, {
        fontFamily: FONT,
        fontSize: `${Math.round(22 * floater.scale)}px`,
        color: floater.color,
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: text,
      y: floater.y - 48,
      alpha: 0,
      duration: 700,
      onComplete: () => text.destroy(),
    });
  }

  private showOutcome(): void {
    if (this.ended) {
      return;
    }
    this.ended = true;
    const win = this.engine.status === "victory";
    const { width, height } = this.scale;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);
    const banner = this.add
      .text(width / 2, height / 2 - 40, win ? "战斗胜利" : "战斗失败", {
        fontFamily: FONT,
        fontSize: "48px",
        color: win ? COLORS.win : COLORS.lose,
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(width / 2, height / 2 + 20, "点击任意处返回洞府", {
        fontFamily: FONT,
        fontSize: "20px",
        color: COLORS.text,
      })
      .setOrigin(0.5);
    this.add.container(0, 0, [dim, banner, sub]);
    dim.setInteractive();
    dim.on("pointerdown", () => this.scene.start("Hub"));
    this.statusText?.setText(win ? "试炼完成" : "再修炼一番吧");
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 280, 56, COLORS.panel).setStrokeStyle(2, COLORS.panelStroke);
    bg.setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.text,
      })
      .setOrigin(0.5);
    bg.on("pointerdown", onClick);
  }
}
