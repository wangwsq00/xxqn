import Phaser from "phaser";
import { ATB_MAX, SLOT_ORDER_TOP_TO_BOTTOM, TICK_MS } from "../combat/constants";
import {
  createHeartDemonEncounter,
  createTrialEncounter,
  type BattleMode,
} from "../combat/encounter";
import { BattleEngine } from "../combat/engine";
import type { ActionResult, Combatant, SlotIndex } from "../combat/types";
import { applyTrialVictoryRewards, formatVictoryRewardText } from "../combat/rewards";
import { equippedWeaponName, gearBonusFromEquipment } from "../equip/state";
import { combatSkillsFromGongfa } from "../gongfa/state";
import { equippedPetCombatant } from "../pet/state";
import { applyHeartDemonDefeat, applyHeartDemonVictory } from "../realm/breakthrough";
import { realmLabel } from "../realm/label";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { getTrialStage } from "../trial/catalog";
import { isTrialStageUnlocked } from "../trial/state";
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
  private save!: SaveData;
  private engine!: BattleEngine;
  private mode: BattleMode = "trial";
  private stageId = 1;
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

  init(data?: { mode?: BattleMode; stageId?: number }): void {
    this.mode = data?.mode === "heartDemon" ? "heartDemon" : "trial";
    this.stageId = data?.stageId ?? 1;
  }

  create(): void {
    this.save = loadSave();
    if (
      this.mode === "trial" &&
      !isTrialStageUnlocked(this.save.trial.highestCleared, this.stageId)
    ) {
      this.scene.start("TrialSelect");
      return;
    }
    const gear = gearBonusFromEquipment(this.save.equipment);
    const realmMajor = this.save.player.realmMajor;
    const skills = combatSkillsFromGongfa(this.save.gongfa);
    const pet = equippedPetCombatant(this.save.pets, realmMajor);
    const allies = pet ? [pet] : [];
    this.engine = new BattleEngine(
      this.mode === "heartDemon"
        ? createHeartDemonEncounter(gear, realmMajor, skills, allies)
        : createTrialEncounter(gear, realmMajor, skills, this.stageId, allies),
    );
    this.views.clear();
    this.slotViews = [];
    this.animating = false;
    this.tickCarry = 0;
    this.ended = false;

    const { width } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    const trialStage = getTrialStage(this.stageId);
    const title =
      this.mode === "heartDemon" ? "心魔挑战" : `试炼 · 第${trialStage.id}关 ${trialStage.name}`;
    this.add
      .text(width / 2, 48, title, {
        fontFamily: FONT,
        fontSize: "36px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const hero = this.engine.units.find((unit) => unit.isHero);
    const weapon = equippedWeaponName(this.save.equipment);
    const atkHint = weapon ? `${weapon} 攻击 ${hero?.stats.atk ?? 0}` : `未穿武器 攻击 ${hero?.stats.atk ?? 0}`;
    const skillHint =
      hero && hero.skills.length > 0
        ? `功法 ${hero.skills.map((skill) => skill.def.name).join("、")}`
        : "未装备功法（普攻）";
    const modeHint =
      this.mode === "heartDemon" ? "战胜即可破境" : `胜利 ${trialStage.stones} 灵石`;
    this.add
      .text(width / 2, 90, `行动条 · ${atkHint} · ${skillHint} · ${modeHint}`, {
        fontFamily: FONT,
        fontSize: "15px",
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

    this.makeButton(width / 2, 1168, this.mode === "trial" ? "返回试炼" : "返回洞府", () =>
      this.leaveBattle(),
    );
    this.refreshViews();
    this.refreshLog();
  }

  update(_time: number, delta: number): void {
    if (!this.engine || this.ended || this.animating) {
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

    const weapon = unit?.isHero ? equippedWeaponName(this.save.equipment) : undefined;
    const title =
      unit?.isHero && slot === 1
        ? `${unit.name} · ${weapon ?? "中"}`
        : unit
          ? `${unit.name} · ${slot}`
          : `空位 ${slot}`;
    const nameText = this.add
      .text(x, y - 38, title, {
        fontFamily: FONT,
        fontSize: "16px",
        color: unit ? COLORS.text : COLORS.muted,
      })
      .setOrigin(0.5);

    const hpBarBg = this.add.rectangle(x, y + 8, BAR_W, 10, COLORS.hpBg).setAlpha(unit ? 1 : 0);
    const hpBar = this.add.rectangle(x - BAR_W / 2, y + 8, BAR_W, 10, COLORS.hp).setOrigin(0, 0.5);
    hpBar.setAlpha(unit ? 1 : 0);
    const atbBarBg = this.add.rectangle(x, y + 24, BAR_W, 8, COLORS.atbBg).setAlpha(unit ? 1 : 0);
    const atbBar = this.add.rectangle(x - BAR_W / 2, y + 24, BAR_W, 8, COLORS.atb).setOrigin(0, 0.5);
    atbBar.setAlpha(unit ? 1 : 0);
    const hpText = this.add
      .text(x, y + 44, unit ? `${unit.stats.hp}/${unit.stats.maxHp}` : "", {
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
      view.hpText.setText(
        unit.alive
          ? unit.shieldHp > 0
            ? `${unit.stats.hp}/${unit.stats.maxHp} 盾${unit.shieldHp}`
            : `${unit.stats.hp}/${unit.stats.maxHp}`
          : "阵亡",
      );
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
    const { lootLine, statusLine, bannerText } = this.resolveOutcome(win);
    const { width, height } = this.scale;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);
    const banner = this.add
      .text(width / 2, height / 2 - 56, bannerText, {
        fontFamily: FONT,
        fontSize: "48px",
        color: win ? COLORS.win : COLORS.lose,
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(width / 2, height / 2 + 16, lootLine, {
        fontFamily: FONT,
        fontSize: "20px",
        color: COLORS.text,
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5);
    this.add.container(0, 0, [dim, banner, sub]);
    dim.setInteractive();
    dim.on("pointerdown", () => this.leaveBattle());
    this.statusText?.setText(statusLine);
  }

  private resolveOutcome(win: boolean): { lootLine: string; statusLine: string; bannerText: string } {
    if (this.mode === "heartDemon") {
      if (win) {
        const result = applyHeartDemonVictory(this.save);
        this.save = result.save;
        persistSave(this.save);
        if (result.succeeded) {
          const from = realmLabel(result.fromMajor, result.fromLayer);
          const to = realmLabel(result.toMajor, result.toLayer);
          return {
            bannerText: "心魔已破",
            lootLine: `${from} → ${to}\n灵气已清零，开始新境修炼\n点击任意处返回洞府`,
            statusLine: `破境成功 · ${to}`,
          };
        }
        return {
          bannerText: "战斗胜利",
          lootLine: "条件已变，未能破境\n点击任意处返回洞府",
          statusLine: "未能破境",
        };
      }
      const result = applyHeartDemonDefeat(this.save);
      this.save = result.save;
      persistSave(this.save);
      return {
        bannerText: "心魔未破",
        lootLine: "境界与灵气不变，可再挑战\n点击任意处返回洞府",
        statusLine: "心魔未破，可再挑战",
      };
    }

    let lootLine = "无奖励\n点击任意处返回试炼";
    let gainedStones = 0;
    if (win) {
      const result = applyTrialVictoryRewards(this.save, this.stageId);
      this.save = result.save;
      persistSave(this.save);
      lootLine = formatVictoryRewardText(result.lines, "点击任意处返回试炼");
      gainedStones = result.loot.stones;
    }
    return {
      bannerText: win ? "战斗胜利" : "战斗失败",
      lootLine,
      statusLine: win ? `第${this.stageId}关完成 · 灵石 +${gainedStones}` : "再修炼一番吧",
    };
  }

  private leaveBattle(): void {
    this.scene.start(this.mode === "trial" ? "TrialSelect" : "Hub");
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
