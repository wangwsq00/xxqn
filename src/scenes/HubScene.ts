import Phaser from "phaser";
import { BACKDROP } from "../assets/backdrops";
import {
  HUB_HERO_FEET_X,
  HUB_HERO_FEET_Y,
  HUB_HERO_HEIGHT,
  HUB_PET_HEIGHT_RATIO,
  PORTRAIT,
} from "../assets/portraits";
import {
  spiritArrayFx,
  spiritArrayTextureKey,
  spiritArrayTier,
  UI_ICON,
} from "../assets/presentation";
import { accrueIdle, claimableAmounts, claimIdle, hasClaimable } from "../idle/settle";
import { getPetDef } from "../pet/catalog";
import { isPeakMinorLayer } from "../realm/costs";
import { cultivationProgressText, cultivationRatio } from "../realm/format";
import { applyMinorLayerUps } from "../realm/upgrade";
import { canChallengeHeartDemon, heartDemonHint } from "../realm/breakthrough";
import { loadSave, persistSave, realmLabel, type SaveData } from "../save/storage";
import { dockTop, makeButton, mountBackdrop, tweenBar, type UiButton } from "../ui/chrome";
import { heroAttributeLines } from "../ui/heroSheet";
import { makeIconTab, type IconTab } from "../ui/iconDock";
import { hasPortrait } from "../ui/portraitView";
import { ensureFaceDisc, ensureMote, ensureSoftBody } from "../ui/softPortrait";
import { BODY_HEX, DOCK_HEIGHT, DOCK_HIT_HEIGHT, FONT, GOLD_HEX, PALETTE, PARCHMENT_HEX } from "../ui/theme";

const QI_BAR_W = 640;

export class HubScene extends Phaser.Scene {
  private save!: SaveData;
  private realmText?: Phaser.GameObjects.Text;
  private stoneText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private breakthroughHint?: Phaser.GameObjects.Text;
  private qiBar?: Phaser.GameObjects.Rectangle;
  private pendingText?: Phaser.GameObjects.Text;
  private claimHint?: Phaser.GameObjects.Text;
  private claimBtn?: UiButton;
  private demonBtn?: UiButton;
  private sheet?: Phaser.GameObjects.Container;
  private sheetOpen = false;
  private attrSheet?: Phaser.GameObjects.Container;
  private attrOpen = false;
  private attrRealm?: Phaser.GameObjects.Text;
  private attrValues: Phaser.GameObjects.Text[] = [];
  private dockHub?: IconTab;
  private dockTrial?: IconTab;
  private dockGrow?: IconTab;
  private arraySpin?: Phaser.GameObjects.Image;
  private arrayRotateMs = 18000;
  private onVisibility?: () => void;

  constructor() {
    super("Hub");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    mountBackdrop(this, BACKDROP.dongfu, { top: 180, bottom: 360, scrim: 0.72 });
    this.drawMeditation();
    this.drawLowerWash(width, height);
    this.drawAvatarCard();

    this.add
      .rectangle(width / 2, 168, QI_BAR_W, 16, PALETTE.stroke)
      .setStrokeStyle(2, PALETTE.gold)
      .setDepth(30);
    this.qiBar = this.add
      .rectangle(width / 2 - QI_BAR_W / 2, 168, QI_BAR_W, 12, PALETTE.cyan)
      .setOrigin(0, 0.5)
      .setDepth(31);
    this.qiBar.setScale(0, 1);

    this.progressText = this.add
      .text(width / 2, 196, "", {
        fontFamily: FONT,
        fontSize: "16px",
        color: PARCHMENT_HEX,
        align: "center",
        wordWrap: { width: 660 },
      })
      .setOrigin(0.5)
      .setDepth(30);

    this.claimHint = this.add
      .text(width / 2, 860, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: BODY_HEX,
        align: "center",
        wordWrap: { width: 640 },
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.breakthroughHint = this.add
      .text(width / 2, 908, "", {
        fontFamily: FONT,
        fontSize: "15px",
        color: PARCHMENT_HEX,
        align: "center",
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.pendingText = this.add
      .text(width / 2, 968, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: GOLD_HEX,
      })
      .setOrigin(0.5)
      .setDepth(40);

    this.claimBtn = makeButton(this, width / 2 - 96, 1048, 420, 84, "领取洞府收益", () => this.claimRewards(), {
      tone: "cinnabar",
      fontSize: 28,
      depth: 40,
    });
    this.demonBtn = makeButton(this, width / 2 + 250, 1048, 176, 72, "挑战心魔", () => this.tryHeartDemon(), {
      tone: "quiet",
      fontSize: 22,
      depth: 40,
    });

    this.buildDock();
    this.buildSheet();
    this.buildAttributeSheet();

    this.refreshIdle();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.refreshIdle(),
    });

    this.onVisibility = () => {
      if (document.visibilityState === "visible") {
        this.refreshIdle();
      }
    };
    document.addEventListener("visibilitychange", this.onVisibility);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.onVisibility) {
        document.removeEventListener("visibilitychange", this.onVisibility);
      }
    });
  }

  update(_time: number, delta: number): void {
    if (!this.arraySpin) {
      return;
    }
    this.arraySpin.angle = (this.arraySpin.angle + (360 * delta) / this.arrayRotateMs) % 360;
  }

  private drawLowerWash(width: number, height: number): void {
    const band = 300;
    const top = height - DOCK_HEIGHT - band;
    const steps = 10;
    const slice = band / steps;
    for (let i = 0; i < steps; i += 1) {
      const alpha = 0.05 + (i / steps) * 0.62;
      const y = top + slice * i + slice / 2;
      this.add.rectangle(width / 2, y, width, slice + 1, PALETTE.ink, alpha).setDepth(20);
    }
  }

  private drawMeditation(): void {
    const tier = spiritArrayTier(this.save.player.gatheringArrayLevel, this.save.player.realmMajor);
    const fx = spiritArrayFx(tier);
    this.arrayRotateMs = fx.rotateMs;
    const arraySize = 500 + tier * 36;
    const feetX = HUB_HERO_FEET_X;
    const feetY = HUB_HERO_FEET_Y;

    this.add.ellipse(feetX, feetY + 16, arraySize * 0.86, 34, PALETTE.stroke, 0.38).setDepth(2);

    const arrayKey = spiritArrayTextureKey(tier);
    if (this.textures.exists(arrayKey)) {
      this.arraySpin = this.add
        .image(feetX, feetY, arrayKey)
        .setDisplaySize(arraySize, arraySize)
        .setDepth(3)
        .setAlpha(fx.alphaMin);
      this.tweens.add({
        targets: this.arraySpin,
        alpha: 1,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const glow = this.add
      .circle(feetX, feetY - HUB_HERO_HEIGHT * 0.4, fx.glowRadius, PALETTE.cyan, fx.glowAlpha)
      .setDepth(4)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: glow,
      alpha: fx.glowAlpha * 0.4,
      scale: 1.08,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const heroKey = ensureSoftBody(this, PORTRAIT.playerHero, HUB_HERO_HEIGHT);
    if (heroKey) {
      const heroRoot = this.add.container(feetX, feetY).setDepth(8);
      heroRoot.add(this.add.image(0, 0, heroKey).setOrigin(0.5, 1));
      this.tweens.add({
        targets: heroRoot,
        scaleX: 1.02,
        scaleY: 1.02,
        duration: 1700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    const pet = this.save.pets.equippedId ? getPetDef(this.save.pets.equippedId) : undefined;
    if (pet && hasPortrait(this, pet.portraitKey)) {
      const petH = Math.round(HUB_HERO_HEIGHT * HUB_PET_HEIGHT_RATIO);
      const petKey = ensureSoftBody(this, pet.portraitKey, petH);
      if (petKey) {
        this.add
          .image(feetX + 156, feetY - 28, petKey)
          .setOrigin(0.5, 1)
          .setDepth(5);
      }
    }

    const mote = ensureMote(this);
    if (this.textures.exists(mote)) {
      this.add
        .particles(feetX, feetY - 6, mote, {
          x: { min: -60 - tier * 22, max: 60 + tier * 22 },
          speedY: { min: -fx.moteSpeed * 1.25, max: -fx.moteSpeed * 0.75 },
          speedX: { min: -16, max: 16 },
          lifespan: { min: 680, max: 1080 },
          frequency: fx.particleFrequency,
          scale: { start: 0.28 + tier * 0.12, end: 0 },
          alpha: { start: 0.9, end: 0 },
          blendMode: Phaser.BlendModes.ADD,
          tint: 0xd8fffb,
        })
        .setDepth(7);
    }
  }

  private drawAvatarCard(): void {
    const bg = this.add.graphics().setDepth(44);
    bg.fillStyle(PALETTE.ink, 0.9);
    bg.fillRoundedRect(16, 16, 400, 100, 28);
    bg.lineStyle(2, PALETTE.gold, 1);
    bg.strokeRoundedRect(17, 17, 398, 98, 27);

    const faceKey = this.textures.exists(PORTRAIT.playerHero)
      ? ensureFaceDisc(this, PORTRAIT.playerHero, 84)
      : null;
    if (faceKey && this.textures.exists(faceKey)) {
      this.add.image(66, 66, faceKey).setDisplaySize(76, 76).setDepth(46);
    }
    const ring = this.add.graphics().setDepth(46);
    ring.lineStyle(3, PALETTE.gold, 1);
    ring.strokeCircle(66, 66, 39);

    this.realmText = this.add
      .text(118, 46, "", {
        fontFamily: FONT,
        fontSize: "24px",
        color: BODY_HEX,
      })
      .setOrigin(0, 0.5)
      .setDepth(46);
    this.stoneText = this.add
      .text(118, 82, "", {
        fontFamily: FONT,
        fontSize: "20px",
        color: GOLD_HEX,
      })
      .setOrigin(0, 0.5)
      .setDepth(46);

    const hit = this.add
      .rectangle(216, 66, 400, 100, PALETTE.ink, 0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(47);
    hit.on("pointerdown", () => this.onAvatar());
  }

  private buildDock(): void {
    const { width, height } = this.scale;
    const bar = this.add
      .rectangle(width / 2, height - DOCK_HEIGHT / 2, width, DOCK_HEIGHT, PALETTE.ink, 0.94)
      .setStrokeStyle(2, PALETTE.gold)
      .setDepth(100);
    bar.setInteractive();
    const y = height - DOCK_HEIGHT / 2;
    const hitW = Math.floor(width / 3) - 16;
    this.dockHub = makeIconTab(this, width / 6, y, hitW, DOCK_HIT_HEIGHT, "洞府", UI_ICON.dongfu, () => {
      this.closeSheet();
      this.closeAttributes();
    }, { tone: "cinnabar", depth: 110 });
    this.dockTrial = makeIconTab(
      this,
      width / 2,
      y,
      hitW,
      DOCK_HIT_HEIGHT,
      "试炼",
      UI_ICON.trial,
      () => this.leaveFor("TrialSelect"),
      { tone: "quiet", depth: 110 },
    );
    this.dockGrow = makeIconTab(
      this,
      (width * 5) / 6,
      y,
      hitW,
      DOCK_HIT_HEIGHT,
      "养成",
      UI_ICON.growth,
      () => this.toggleSheet(),
      { tone: "quiet", depth: 110 },
    );
  }

  private buildSheet(): void {
    const { width, height } = this.scale;
    const sheet = this.add.container(0, 0).setDepth(80).setVisible(false);
    const dimH = height - DOCK_HEIGHT;
    const dim = this.add
      .rectangle(width / 2, dimH / 2, width, dimH, PALETTE.ink, 0.5)
      .setInteractive();
    dim.on("pointerdown", () => this.closeSheet());
    const panelH = 560;
    const panelBottom = dockTop(this) - 12;
    const panelY = panelBottom - panelH / 2;
    const panel = this.add
      .rectangle(width / 2, panelY, 660, panelH, PALETTE.ink, 0.94)
      .setStrokeStyle(2, PALETTE.gold)
      .setInteractive();
    const title = this.add
      .text(width / 2, panelY - panelH / 2 + 48, "养成", {
        fontFamily: FONT,
        fontSize: "32px",
        color: BODY_HEX,
      })
      .setOrigin(0.5);
    sheet.add([dim, panel, title]);

    const entries: { label: string; sceneKey: string }[] = [
      { label: "聚灵阵", sceneKey: "Gathering" },
      { label: "装备", sceneKey: "Equip" },
      { label: "功法", sceneKey: "Gongfa" },
      { label: "灵宠", sceneKey: "Pet" },
    ];
    entries.forEach((entry, index) => {
      const y = panelY - 150 + index * 112;
      const button = makeButton(this, width / 2, y, 560, 100, entry.label, () => this.leaveFor(entry.sceneKey), {
        tone: "gold",
        fontSize: 30,
        depth: 82,
      });
      sheet.add(button.root);
    });
    this.sheet = sheet;
  }

  private buildAttributeSheet(): void {
    const { width, height } = this.scale;
    const sheet = this.add.container(0, 0).setDepth(90).setVisible(false);
    const dimH = height - DOCK_HEIGHT;
    const dim = this.add
      .rectangle(width / 2, dimH / 2, width, dimH, PALETTE.ink, 0.55)
      .setInteractive();
    dim.on("pointerdown", () => this.closeAttributes());
    const panelH = 620;
    const panelBottom = dockTop(this) - 12;
    const panelY = panelBottom - panelH / 2;
    const panel = this.add
      .rectangle(width / 2, panelY, 660, panelH, PALETTE.ink, 0.96)
      .setStrokeStyle(2, PALETTE.gold)
      .setInteractive();
    const title = this.add
      .text(width / 2, panelY - panelH / 2 + 48, "详细属性", {
        fontFamily: FONT,
        fontSize: "32px",
        color: BODY_HEX,
      })
      .setOrigin(0.5);
    this.attrRealm = this.add
      .text(width / 2, panelY - panelH / 2 + 92, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: PARCHMENT_HEX,
      })
      .setOrigin(0.5);
    sheet.add([dim, panel, title, this.attrRealm]);

    const lines = heroAttributeLines(this.save);
    lines.forEach((line, index) => {
      const col = index < 5 ? 0 : 1;
      const row = index % 5;
      const x = width / 2 - 270 + col * 300;
      const y = panelY - 150 + row * 72;
      const label = this.add
        .text(x, y, line.label, {
          fontFamily: FONT,
          fontSize: "22px",
          color: PARCHMENT_HEX,
        })
        .setOrigin(0, 0.5);
      const value = this.add
        .text(x + 130, y, line.value, {
          fontFamily: FONT,
          fontSize: "26px",
          color: GOLD_HEX,
        })
        .setOrigin(0, 0.5);
      this.attrValues.push(value);
      sheet.add([label, value]);
    });

    const close = makeButton(this, width / 2, panelY + panelH / 2 - 64, 240, 72, "关闭", () => this.closeAttributes(), {
      tone: "cinnabar",
      fontSize: 26,
      depth: 92,
    });
    sheet.add(close.root);
    this.attrSheet = sheet;
  }

  private onAvatar(): void {
    if (this.attrOpen) {
      this.closeAttributes();
      return;
    }
    this.openAttributes();
  }

  private openAttributes(): void {
    this.closeSheet();
    if (!this.attrSheet) {
      return;
    }
    this.paintAttributes();
    this.attrOpen = true;
    this.tweens.killTweensOf(this.attrSheet);
    this.attrSheet.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.attrSheet, alpha: 1, duration: 160, ease: "Quad.easeOut" });
  }

  private closeAttributes(): void {
    const wasOpen = this.attrOpen;
    this.attrOpen = false;
    const sheet = this.attrSheet;
    if (!sheet || !wasOpen) {
      return;
    }
    this.tweens.killTweensOf(sheet);
    this.tweens.add({
      targets: sheet,
      alpha: 0,
      duration: 120,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.attrOpen) {
          sheet.setVisible(false);
        }
      },
    });
  }

  private paintAttributes(): void {
    const lines = heroAttributeLines(this.save);
    lines.forEach((line, index) => {
      this.attrValues[index]?.setText(line.value);
    });
    const { realmMajor, realmLayer } = this.save.player;
    this.attrRealm?.setText(realmLabel(realmMajor, realmLayer));
  }

  private toggleSheet(): void {
    this.closeAttributes();
    if (this.sheetOpen) {
      this.closeSheet();
      return;
    }
    this.openSheet();
  }

  private openSheet(): void {
    if (!this.sheet) {
      return;
    }
    this.sheetOpen = true;
    this.tweens.killTweensOf(this.sheet);
    this.sheet.setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.sheet, alpha: 1, duration: 160, ease: "Quad.easeOut" });
    this.syncDock();
  }

  private closeSheet(): void {
    const wasOpen = this.sheetOpen;
    this.sheetOpen = false;
    this.syncDock();
    const sheet = this.sheet;
    if (!sheet || !wasOpen) {
      return;
    }
    this.tweens.killTweensOf(sheet);
    this.tweens.add({
      targets: sheet,
      alpha: 0,
      duration: 120,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (!this.sheetOpen) {
          sheet.setVisible(false);
        }
      },
    });
  }

  private syncDock(): void {
    this.dockHub?.setTone(this.sheetOpen ? "quiet" : "cinnabar");
    this.dockGrow?.setTone(this.sheetOpen ? "cinnabar" : "quiet");
    this.dockTrial?.setTone("quiet");
  }

  private leaveFor(sceneKey: string): void {
    const { save } = accrueIdle(this.save);
    this.save = save;
    persistSave(this.save);
    this.scene.start(sceneKey);
  }

  private refreshIdle(): void {
    const { save } = accrueIdle(this.save);
    const cultivated = applyMinorLayerUps(save);
    this.save = cultivated.save;
    persistSave(this.save);
    this.paint();
  }

  private paint(): void {
    const { realmMajor, realmLayer, lingqi, stones } = this.save.player;
    const pending = claimableAmounts(this.save);
    this.realmText?.setText(realmLabel(realmMajor, realmLayer));
    this.stoneText?.setText(`灵石 ${Math.floor(stones)}`);
    this.progressText?.setText(cultivationProgressText(realmMajor, realmLayer, lingqi));
    if (this.qiBar) {
      tweenBar(this, this.qiBar, cultivationRatio(realmMajor, realmLayer, lingqi), 180);
    }
    this.paintAttributes();

    const demonReady = canChallengeHeartDemon(this.save);
    this.breakthroughHint?.setText(heartDemonHint(this.save));
    this.breakthroughHint?.setColor(demonReady ? GOLD_HEX : PARCHMENT_HEX);
    this.demonBtn?.setTone(demonReady ? "gold" : "quiet");

    this.pendingText?.setText(
      pending.lingqi > 0 || pending.stones > 0
        ? `待领取  灵气 ${pending.lingqi}  ·  灵石 ${pending.stones}`
        : "",
    );
    const canClaim = hasClaimable(this.save);
    this.claimBtn?.setTone(canClaim ? "cinnabar" : "quiet");
    this.claimBtn?.setLabel(canClaim ? "领取洞府收益" : "暂无可领");
  }

  private claimRewards(): void {
    const { save: accrued } = accrueIdle(this.save);
    const pending = claimableAmounts(accrued);
    const { save: claimed } = claimIdle(accrued);
    const cultivated = applyMinorLayerUps(claimed);
    this.save = cultivated.save;
    persistSave(this.save);
    if (pending.lingqi > 0 || pending.stones > 0) {
      const lines = [`已领取  灵气 ${pending.lingqi}  ·  灵石 ${pending.stones}`];
      if (cultivated.layersGained > 0) {
        lines.push(
          `修为提升：${realmLabel(cultivated.fromMajor, cultivated.fromLayer)} → ${realmLabel(cultivated.toMajor, cultivated.toLayer)}`,
        );
      }
      this.claimHint?.setColor(CYAN_HEX);
      this.claimHint?.setText(lines.join("\n"));
    } else {
      this.claimHint?.setColor(PARCHMENT_HEX);
      this.claimHint?.setText("尚无整数收益，稍后再来");
    }
    this.paint();
  }

  private tryHeartDemon(): void {
    if (!canChallengeHeartDemon(this.save)) {
      this.claimHint?.setColor(PARCHMENT_HEX);
      this.claimHint?.setText(
        isPeakMinorLayer(this.save.player.realmLayer)
          ? this.save.player.realmMajor >= 9
            ? "已至渡劫境九层，无法再破大境"
            : "灵气未满 100%，无法挑战心魔"
          : "需当前大境九层且灵气达 100% 方可挑战心魔",
      );
      return;
    }
    const { save } = accrueIdle(this.save);
    this.save = save;
    persistSave(this.save);
    this.scene.start("Battle", { mode: "heartDemon" });
  }
}

const CYAN_HEX = "#3AA8A0";
