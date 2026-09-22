import Phaser from "phaser";
import { ALLY_SLOT_X, SLOT_FOOT_Y, SLOT_ORDER_TOP_TO_BOTTOM, TICK_MS } from "../combat/constants";
import {
  createHeartDemonEncounter,
  createTrialEncounter,
  type BattleMode,
} from "../combat/encounter";
import { BattleEngine } from "../combat/engine";
import type { ActionResult, Combatant, SlotIndex, TargetResult } from "../combat/types";
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
import { hasPortrait } from "../ui/portraitView";
import { ensureMote, ensureSoftBody } from "../ui/softPortrait";
import { SharedSpeedBar } from "../ui/speedBar";
import { COLORS, FONT, PALETTE } from "../ui/theme";

interface SlotView {
  slot: SlotIndex;
  side: Combatant["side"];
  rootX: number;
  rootY: number;
  root: Phaser.GameObjects.Container;
  portrait?: Phaser.GameObjects.Image;
  nameText: Phaser.GameObjects.Text;
  hpBar: Phaser.GameObjects.Rectangle;
  hpText: Phaser.GameObjects.Text;
  displayH: number;
  collapsed: boolean;
  baseTint: number | null;
}

const BAR_W = 92;

export class BattleScene extends Phaser.Scene {
  private save!: SaveData;
  private engine!: BattleEngine;
  private mode: BattleMode = "trial";
  private stageId = 1;
  private views = new Map<string, SlotView>();
  private slotViews: SlotView[] = [];
  private logText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private speedBar?: SharedSpeedBar;
  private actingId: string | null = null;
  private animating = false;
  private deferDeath = false;
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
    this.actingId = null;
    this.animating = false;
    this.deferDeath = false;
    this.tickCarry = 0;
    this.ended = false;

    const { width } = this.scale;
    mountBackdrop(this, BACKDROP.battle, { top: 96, bottom: 340, scrim: 0.5 });

    const trialStage = getTrialStage(this.stageId);
    const title =
      this.mode === "heartDemon" ? "心魔挑战" : `试炼 · 第${trialStage.id}关 ${trialStage.name}`;
    this.add
      .text(width / 2, 22, title, {
        fontFamily: FONT,
        fontSize: "24px",
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(62);

    this.speedBar = new SharedSpeedBar(this, 64);

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
      this.deferDeath = Boolean(action);
      if (action) {
        this.actingId = action.actorId;
      }
      this.refreshViews();
      this.deferDeath = false;
      if (action) {
        this.playAction(action);
        break;
      }
    }
  }

  private drawSlot(side: Combatant["side"], slot: SlotIndex, x: number, y: number): void {
    const unit = this.engine.units.find((item) => item.side === side && item.slot === slot);
    if (!unit) {
      this.add.ellipse(x, y, 68, 14, PALETTE.gold, 0.16).setDepth(2);
      return;
    }

    const order = SLOT_ORDER_TOP_TO_BOTTOM.indexOf(slot);
    const visualX = !unit.isHero && side === "ally" ? x + 200 : x;
    const root = this.add.container(visualX, y).setDepth(12 + order);
    const spriteH = unit.isHero
      ? BATTLE_HERO_HEIGHT
      : side === "enemy"
        ? BATTLE_ENEMY_HEIGHT
        : BATTLE_PET_HEIGHT;

    root.add(this.add.ellipse(0, 4, spriteH * 0.42, 16, PALETTE.stroke, 0.4));

    let portrait: Phaser.GameObjects.Image | undefined;
    let baseTint: number | null = null;
    if (hasPortrait(this, unit.portraitKey)) {
      const key = ensureSoftBody(this, unit.portraitKey, spriteH) ?? unit.portraitKey;
      portrait = this.add.image(0, 0, key).setOrigin(0.5, 1);
      if (unit.portraitKey === PORTRAIT.enemyHeartDemon) {
        baseTint = 0xe8d6ff;
        portrait.setTint(baseTint);
      }
      root.add(portrait);
    }

    const head = -spriteH;
    const nameText = this.add
      .text(0, head - 18, unit.name, {
        fontFamily: FONT,
        fontSize: "14px",
        color: COLORS.text,
        stroke: "#0E1620",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1);
    const barY = head - 8;
    const hpBarBg = this.add.rectangle(0, barY, BAR_W, 8, COLORS.hpBg).setOrigin(0.5);
    const hpBar = this.add.rectangle(-BAR_W / 2, barY, BAR_W, 8, COLORS.hp).setOrigin(0, 0.5);
    const hpText = this.add
      .text(0, barY - 8, `${unit.stats.hp}/${unit.stats.maxHp}`, {
        fontFamily: FONT,
        fontSize: "12px",
        color: COLORS.parchment,
        stroke: "#0E1620",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 1);
    root.add([nameText, hpBarBg, hpBar, hpText]);

    const view: SlotView = {
      slot,
      side,
      rootX: visualX,
      rootY: y,
      root,
      portrait,
      nameText,
      hpBar,
      hpText,
      displayH: spriteH,
      collapsed: false,
      baseTint,
    };
    this.slotViews.push(view);
    this.views.set(unit.id, view);
  }

  private refreshViews(): void {
    for (const view of this.slotViews) {
      const unit = this.engine.units.find((item) => item.side === view.side && item.slot === view.slot);
      if (!unit) {
        continue;
      }
      const hpRatio = unit.stats.maxHp <= 0 ? 0 : unit.stats.hp / unit.stats.maxHp;
      if (!unit.alive) {
        view.hpText.setText("阵亡");
        if (this.chromeReady) {
          tweenBar(this, view.hpBar, 0, 120);
        } else {
          view.hpBar.scaleX = 0;
        }
        if (!view.collapsed && !this.deferDeath) {
          this.collapse(view);
        }
        continue;
      }
      if (this.chromeReady) {
        tweenBar(this, view.hpBar, hpRatio, 160);
      } else {
        view.hpBar.scaleX = Math.max(0, hpRatio);
      }
      view.hpText.setText(
        unit.shieldHp > 0
          ? `${unit.stats.hp}/${unit.stats.maxHp} 盾${unit.shieldHp}`
          : `${unit.stats.hp}/${unit.stats.maxHp}`,
      );
    }
    this.syncSpeed();
  }

  private syncSpeed(): void {
    this.speedBar?.sync(this, this.engine.units, this.actingId);
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

    const impactAt = action.isBasicAttack ? 150 : 180;
    if (actorView && action.isBasicAttack) {
      this.lunge(actorView, action);
    } else if (actorView) {
      this.castPose(actorView, action);
    }

    action.targets.forEach((target, index) => {
      this.time.delayedCall(impactAt + index * 30, () => this.impactTarget(action, target));
    });

    const floaterCount = action.targets.reduce(
      (count, target) => count + target.segments.filter((segment) => segment.trigger !== "skip").length,
      0,
    );
    const wait = impactAt + Math.max(340, floaterCount * 180 + 140);
    this.time.delayedCall(wait, () => {
      this.actingId = null;
      this.refreshViews();
      this.refreshLog();
      this.animating = false;
      if (this.engine.status !== "ongoing") {
        this.showOutcome();
      }
    });
  }

  private lunge(view: SlotView, action: ActionResult): void {
    const primaryId = action.targets[0]?.targetId;
    const primary = primaryId ? this.views.get(primaryId) : undefined;
    const dir = primary ? Math.sign(primary.rootX - view.rootX) || 1 : view.side === "ally" ? 1 : -1;
    const dy = primary ? Math.max(-48, Math.min(48, (primary.rootY - view.rootY) * 0.28)) : 0;
    if (view.portrait) {
      view.portrait.setTint(0xffe7a8);
      this.time.delayedCall(160, () => this.restorePortrait(view));
    }
    this.tweens.add({
      targets: view.root,
      x: view.rootX + dir * 96,
      y: view.rootY + dy,
      duration: 150,
      yoyo: true,
      ease: "Quad.easeOut",
    });
  }

  private castPose(view: SlotView, action: ActionResult): void {
    this.tweens.add({
      targets: view.root,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 130,
      yoyo: true,
      ease: "Sine.easeOut",
    });
    if (view.portrait) {
      view.portrait.setTint(view.side === "ally" ? 0xc8fff8 : 0xffc2b0);
      this.time.delayedCall(170, () => this.restorePortrait(view));
    }
    for (const target of action.targets) {
      const to = this.views.get(target.targetId);
      if (to) {
        this.spawnBolt(view, to);
      }
    }
  }

  private spawnBolt(from: SlotView, to: SlotView): void {
    const mote = ensureMote(this);
    if (!this.textures.exists(mote)) {
      return;
    }
    const bolt = this.add
      .image(from.rootX, from.rootY - from.displayH * 0.45, mote)
      .setDepth(48)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setScale(from.side === "ally" ? 1.15 : 1);
    if (from.side === "enemy") {
      bolt.setTint(0xff6a4a);
    }
    this.tweens.add({
      targets: bolt,
      x: to.rootX,
      y: to.rootY - to.displayH * 0.42,
      duration: 170,
      ease: "Quad.easeIn",
      onComplete: () => bolt.destroy(),
    });
  }

  private spawnSlash(view: SlotView): void {
    const g = this.add.graphics().setDepth(48);
    const x = view.rootX;
    const y = view.rootY - view.displayH * 0.48;
    g.lineStyle(5, PALETTE.parchment, 0.95);
    g.beginPath();
    g.moveTo(x - 30, y - 16);
    g.lineTo(x + 28, y + 18);
    g.strokePath();
    g.lineStyle(2, PALETTE.cyan, 0.8);
    g.beginPath();
    g.moveTo(x - 18, y + 10);
    g.lineTo(x + 22, y - 14);
    g.strokePath();
    this.tweens.add({
      targets: g,
      alpha: 0,
      duration: 180,
      delay: 40,
      onComplete: () => g.destroy(),
    });
  }

  private impactTarget(action: ActionResult, target: TargetResult): void {
    const view = this.views.get(target.targetId);
    if (!view) {
      return;
    }
    const unit = this.engine.units.find((item) => item.id === target.targetId);
    const landed = target.segments.some((segment) => segment.trigger === "hit");
    if (landed) {
      this.flashHit(view);
    }
    if (action.isBasicAttack && landed) {
      this.spawnSlash(view);
    }
    target.segments.forEach((segment, index) => {
      if (segment.trigger === "skip") {
        return;
      }
      if (segment.trigger === "miss") {
        this.spawnFloater({
          x: view.rootX,
          y: view.rootY - view.displayH * 0.5 - index * 16,
          text: "闪避",
          color: COLORS.muted,
          scale: 1,
        });
        return;
      }
      const parts = [String(segment.damage)];
      if (segment.crit) {
        parts.unshift("暴击");
      }
      if (segment.blocked) {
        parts.push("格挡");
      }
      this.spawnFloater({
        x: view.rootX,
        y: view.rootY - view.displayH * 0.5 - index * 16,
        text: parts.join(" "),
        color: segment.crit ? "#ffb347" : "#fff6d8",
        scale: segment.crit ? 1.25 : 1,
      });
    });
    if (unit && !unit.alive) {
      this.collapse(view);
    }
  }

  private flashHit(view: SlotView): void {
    if (!view.portrait) {
      return;
    }
    view.portrait.setTintFill(0xfff4dc);
    this.time.delayedCall(80, () => this.restorePortrait(view));
  }

  private restorePortrait(view: SlotView): void {
    if (!view.portrait?.active) {
      return;
    }
    if (view.baseTint != null) {
      view.portrait.setTint(view.baseTint);
      return;
    }
    view.portrait.clearTint();
  }

  private collapse(view: SlotView): void {
    if (view.collapsed) {
      return;
    }
    view.collapsed = true;
    this.tweens.add({
      targets: view.root,
      alpha: 0,
      scaleY: 0.15,
      duration: 280,
      ease: "Cubic.easeIn",
    });
  }

  private spawnFloater(floater: { x: number; y: number; text: string; color: string; scale: number }): void {
    const text = this.add
      .text(floater.x, floater.y, floater.text, {
        fontFamily: FONT,
        fontSize: `${Math.round(22 * floater.scale)}px`,
        color: floater.color,
        stroke: "#0E1620",
        strokeThickness: 3,
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
