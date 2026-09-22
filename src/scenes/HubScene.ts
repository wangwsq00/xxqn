import Phaser from "phaser";
import { BACKDROP } from "../assets/backdrops";
import {
  HUB_HERO_FEET_X,
  HUB_HERO_FEET_Y,
  HUB_HERO_HEIGHT,
  HUB_PET_HEIGHT_RATIO,
  PORTRAIT,
} from "../assets/portraits";
import { accrueIdle, claimableAmounts, claimIdle, hasClaimable } from "../idle/settle";
import { getPetDef } from "../pet/catalog";
import { isPeakMinorLayer } from "../realm/costs";
import { cultivationProgressText, cultivationRatio } from "../realm/format";
import { applyMinorLayerUps } from "../realm/upgrade";
import { canChallengeHeartDemon, heartDemonHint } from "../realm/breakthrough";
import { loadSave, persistSave, realmLabel, type SaveData } from "../save/storage";
import { dockTop, makeButton, makeChip, mountBackdrop, tweenBar, type UiButton } from "../ui/chrome";
import { addStandingPlate } from "../ui/portraitView";
import { BODY_HEX, DOCK_HEIGHT, DOCK_HIT_HEIGHT, FONT, PALETTE, PARCHMENT_HEX } from "../ui/theme";

const QI_BAR_W = 640;

export class HubScene extends Phaser.Scene {
  private save!: SaveData;
  private realmText?: Phaser.GameObjects.Text;
  private qiText?: Phaser.GameObjects.Text;
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
  private dockHub?: UiButton;
  private dockTrial?: UiButton;
  private dockGrow?: UiButton;
  private onVisibility?: () => void;

  constructor() {
    super("Hub");
  }

  create(): void {
    this.save = loadSave();
    const { width } = this.scale;
    mountBackdrop(this, BACKDROP.dongfu, { top: 200, bottom: 420, scrim: 0.78 });
    this.drawFigures();

    this.add
      .text(width / 2, 36, "修仙千年", {
        fontFamily: FONT,
        fontSize: "28px",
        color: GOLD_COLOR,
      })
      .setOrigin(0.5)
      .setDepth(30);

    const chipY = 92;
    const chipW = 208;
    this.realmText = makeChip(this, width / 2 - (chipW + 12), chipY, chipW, 52, "");
    this.qiText = makeChip(this, width / 2, chipY, chipW, 52, "");
    this.stoneText = makeChip(this, width / 2 + (chipW + 12), chipY, chipW, 52, "");

    this.add
      .rectangle(width / 2, 150, QI_BAR_W, 16, PALETTE.stroke)
      .setStrokeStyle(2, PALETTE.gold)
      .setDepth(30);
    this.qiBar = this.add
      .rectangle(width / 2 - QI_BAR_W / 2, 150, QI_BAR_W, 12, PALETTE.cyan)
      .setOrigin(0, 0.5)
      .setDepth(31);
    this.qiBar.setScale(0, 1);

    this.progressText = this.add
      .text(width / 2, 178, "", {
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
        color: GOLD_COLOR,
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

  private drawFigures(): void {
    const heroH = HUB_HERO_HEIGHT;
    this.add
      .ellipse(HUB_HERO_FEET_X, HUB_HERO_FEET_Y + 8, heroH * 0.7, 26, PALETTE.stroke, 0.4)
      .setDepth(3);
    addStandingPlate(this, HUB_HERO_FEET_X, HUB_HERO_FEET_Y, PORTRAIT.playerHero, heroH, {
      depth: 8,
      stroke: PALETTE.gold,
    });

    const pet = this.save.pets.equippedId ? getPetDef(this.save.pets.equippedId) : undefined;
    if (!pet) {
      return;
    }
    const petH = Math.round(heroH * HUB_PET_HEIGHT_RATIO);
    addStandingPlate(this, HUB_HERO_FEET_X + 156, HUB_HERO_FEET_Y - 28, pet.portraitKey, petH, {
      depth: 4,
      stroke: PALETTE.cyan,
    });
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
    this.dockHub = makeButton(this, width / 6, y, hitW, DOCK_HIT_HEIGHT, "洞府", () => this.closeSheet(), {
      tone: "cinnabar",
      fontSize: 30,
      depth: 110,
    });
    this.dockTrial = makeButton(this, width / 2, y, hitW, DOCK_HIT_HEIGHT, "试炼", () => this.leaveFor("TrialSelect"), {
      tone: "quiet",
      fontSize: 30,
      depth: 110,
    });
    this.dockGrow = makeButton(this, (width * 5) / 6, y, hitW, DOCK_HIT_HEIGHT, "养成", () => this.toggleSheet(), {
      tone: "quiet",
      fontSize: 30,
      depth: 110,
    });
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

  private toggleSheet(): void {
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
    this.qiText?.setText(`灵气 ${Math.floor(lingqi)}`);
    this.stoneText?.setText(`灵石 ${Math.floor(stones)}`);
    this.progressText?.setText(cultivationProgressText(realmMajor, realmLayer, lingqi));
    if (this.qiBar) {
      tweenBar(this, this.qiBar, cultivationRatio(realmMajor, realmLayer, lingqi), 180);
    }

    const demonReady = canChallengeHeartDemon(this.save);
    this.breakthroughHint?.setText(heartDemonHint(this.save));
    this.breakthroughHint?.setColor(demonReady ? GOLD_COLOR : PARCHMENT_HEX);
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
      this.claimHint?.setColor(CYAN_COLOR);
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

const GOLD_COLOR = "#C9A227";
const CYAN_COLOR = "#3AA8A0";
