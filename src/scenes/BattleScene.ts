import Phaser from "phaser";
import { ALLY_SLOT_X, ATB_MAX, SLOT_FOOT_Y, SLOT_ORDER_TOP_TO_BOTTOM, TICK_MS } from "../combat/constants";
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
import { BACKDROP } from "../assets/backdrops";
import { BATTLE_ENEMY_HEIGHT, BATTLE_HERO_HEIGHT, BATTLE_PET_HEIGHT, PORTRAIT } from "../assets/portraits";
import { makeButton, mountBackdrop, tweenBar } from "../ui/chrome";
import { addPortrait, hasPortrait } from "../ui/portraitView";
import { COLORS, FONT, PALETTE } from "../ui/theme";

interface SlotView {
  slot: SlotIndex;
  side: Combatant["side"];
  rootX: number;
  rootY: number;
  root: Phaser.GameObjects.Container;
  body: Phaser.GameObjects.Rectangle;
  portrait?: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  hpBarBg: Phaser.GameObjects.Rectangle;
  hpBar: Phaser.GameObjects.Rectangle;
  atbBarBg: Phaser.GameObjects.Rectangle;
  atbBar: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  displayH: number;
}

const BAR_W = 112;
const EMPTY_SLOT_W = 120;
const EMPTY_SLOT_H = 56;

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
  private chromeReady = false;

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
    mountBackdrop(this, BACKDROP.battle, { top: 120, bottom: 340, scrim: 0.55 });

    const trialStage = getTrialStage(this.stageId);
    const title =
      this.mode === "heartDemon" ? "心魔挑战" : `试炼 · 第${trialStage.id}关 ${trialStage.name}`;
    this.add
      .text(width / 2, 44, title, {
        fontFamily: FONT,
        fontSize: "32px",
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.add
      .text(78, 44, "我方", {
        fontFamily: FONT,
        fontSize: "20px",
        color: COLORS.cyanHex,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.add
      .text(width - 78, 44, "敌方", {
        fontFamily: FONT,
        fontSize: "20px",
        color: COLORS.cinnabarHex,
      })
      .setOrigin(0.5)
      .setDepth(40);

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
      .text(width / 2, 848, `${atkHint}  ·  ${skillHint}  ·  ${modeHint}`, {
        fontFamily: FONT,
        fontSize: "15px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5)
      .setDepth(40);

    const enemyX = width - ALLY_SLOT_X;
    SLOT_ORDER_TOP_TO_BOTTOM.forEach((slot) => {
      const y = SLOT_FOOT_Y[slot];
      this.drawSlot("ally", slot, ALLY_SLOT_X, y);
      this.drawSlot("enemy", slot, enemyX, y);
    });

    this.add
      .rectangle(width / 2, 990, 640, 150, PALETTE.ink, 0.9)
      .setStrokeStyle(2, PALETTE.gold)
      .setDepth(40);
    this.logText = this.add
      .text(70, 928, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.log,
        lineSpacing: 6,
        wordWrap: { width: 580 },
      })
      .setOrigin(0, 0)
      .setDepth(41);

    this.statusText = this.add
      .text(width / 2, 1096, "行动条充能中…", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.muted,
      })
      .setOrigin(0.5)
      .setDepth(41);

    makeButton(
      this,
      width / 2,
      1184,
      280,
      64,
      this.mode === "trial" ? "返回试炼" : "返回洞府",
      () => this.leaveBattle(),
      { tone: "gold", fontSize: 22, depth: 42 },
    );
    this.refreshViews();
    this.chromeReady = true;
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
    const order = SLOT_ORDER_TOP_TO_BOTTOM.indexOf(slot);
    const visualX = unit && !unit.isHero && side === "ally" ? x + 200 : x;
    const root = this.add.container(visualX, y).setDepth((unit ? 12 : 2) + order);

    const showArt = Boolean(unit && hasPortrait(this, unit.portraitKey));
    const spriteH = unit
      ? unit.isHero
        ? BATTLE_HERO_HEIGHT
        : side === "enemy"
          ? BATTLE_ENEMY_HEIGHT
          : BATTLE_PET_HEIGHT
      : EMPTY_SLOT_H;
    const body = this.add
      .rectangle(0, 0, showArt ? spriteH : EMPTY_SLOT_W, showArt ? spriteH : EMPTY_SLOT_H, PALETTE.ink, unit ? 0.15 : 0.55)
      .setOrigin(0.5, 1)
      .setStrokeStyle(2, unit?.isHero ? PALETTE.gold : PALETTE.gold);
    body.setVisible(!showArt);
    root.add(body);

    let portrait: Phaser.GameObjects.Image | undefined;
    if (unit && hasPortrait(this, unit.portraitKey)) {
      portrait = addPortrait(this, 0, 0, unit.portraitKey, spriteH, { x: 0.5, y: 1 });
      if (unit.portraitKey === PORTRAIT.enemyHeartDemon) {
        portrait.setTint(0xe8d6ff);
      }
      root.add(portrait);
    }

    const weapon = unit?.isHero ? equippedWeaponName(this.save.equipment) : undefined;
    const title =
      unit?.isHero && slot === 1
        ? `${unit.name} · ${weapon ?? "中"}`
        : unit
          ? `${unit.name} · ${slot}`
          : "";
    const nameY = showArt ? -spriteH + 16 : -EMPTY_SLOT_H - 4;
    const nameText = this.add
      .text(0, nameY, title, {
        fontFamily: FONT,
        fontSize: "15px",
        color: unit ? COLORS.text : COLORS.muted,
        stroke: "#0E1620",
        strokeThickness: unit ? 4 : 0,
      })
      .setOrigin(0.5, 0);
    const barW = showArt ? Math.min(200, spriteH - 28) : BAR_W;
    const barY = showArt ? -spriteH + 40 : -14;
    const plate = this.add
      .rectangle(0, showArt ? -spriteH + 36 : -16, barW + 20, showArt ? 58 : 28, PALETTE.ink, unit ? 0.88 : 0)
      .setStrokeStyle(unit ? 2 : 0, PALETTE.gold);
    const hpBarBg = this.add.rectangle(0, barY, barW, 12, COLORS.hpBg).setOrigin(0.5).setAlpha(unit ? 1 : 0);
    const hpBar = this.add.rectangle(-barW / 2, barY, barW, 12, COLORS.hp).setOrigin(0, 0.5);
    hpBar.setAlpha(unit ? 1 : 0);
    const atbBarBg = this.add.rectangle(0, barY + 16, barW, 8, COLORS.atbBg).setOrigin(0.5).setAlpha(unit ? 1 : 0);
    const atbBar = this.add.rectangle(-barW / 2, barY + 16, barW, 8, COLORS.atb).setOrigin(0, 0.5);
    atbBar.setAlpha(unit ? 1 : 0);
    const hpText = this.add
      .text(0, barY - 16, unit ? `${unit.stats.hp}/${unit.stats.maxHp}` : "", {
        fontFamily: FONT,
        fontSize: "13px",
        color: COLORS.parchment,
        stroke: "#0E1620",
        strokeThickness: unit ? 3 : 0,
      })
      .setOrigin(0.5, 1);
    root.add([plate, nameText, hpBarBg, hpBar, atbBarBg, atbBar, hpText]);
    if (!unit) {
      body.setSize(56, 8).setFillStyle(PALETTE.gold, 0.35).setStrokeStyle(0);
      plate.setVisible(false);
      nameText.setVisible(false);
    } else if (!showArt) {
      plate.setVisible(false);
    }

    const view: SlotView = {
      slot,
      side,
      rootX: visualX,
      rootY: y,
      root,
      body,
      portrait,
      nameText,
      hpBarBg,
      hpBar,
      atbBarBg,
      atbBar,
      hpText,
      displayH: spriteH,
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
      if (this.chromeReady) {
        tweenBar(this, view.hpBar, hpRatio, 160);
        tweenBar(this, view.atbBar, atbRatio, 80);
      } else {
        view.hpBar.scaleX = Math.max(0, hpRatio);
        view.atbBar.scaleX = Math.max(0, Math.min(1, atbRatio));
      }
      view.hpText.setText(
        unit.alive
          ? unit.shieldHp > 0
            ? `${unit.stats.hp}/${unit.stats.maxHp} 盾${unit.shieldHp}`
            : `${unit.stats.hp}/${unit.stats.maxHp}`
          : "阵亡",
      );
      const fade = unit.alive ? 1 : 0.38;
      view.body.setAlpha(fade);
      view.portrait?.setAlpha(fade);
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
        targets: actorView.root,
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
          floaters.push({ x: view.rootX, y: view.rootY - view.displayH * 0.55, text: "闪避", color: COLORS.muted, scale: 1 });
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
            y: view.rootY - view.displayH * 0.55,
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
      .setOrigin(0.5)
      .setDepth(55);
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
    const dim = this.add.rectangle(width / 2, height / 2, width, height, PALETTE.ink, 0.62).setDepth(70);
    const banner = this.add
      .text(width / 2, height / 2 - 56, bannerText, {
        fontFamily: FONT,
        fontSize: "48px",
        color: win ? COLORS.win : COLORS.lose,
      })
      .setOrigin(0.5)
      .setDepth(71);
    const sub = this.add
      .text(width / 2, height / 2 + 16, lootLine, {
        fontFamily: FONT,
        fontSize: "20px",
        color: COLORS.text,
        align: "center",
        lineSpacing: 8,
      })
      .setOrigin(0.5)
      .setDepth(71);
    this.add.container(0, 0, [dim, banner, sub]).setDepth(70);
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

}
