import Phaser from "phaser";
import { BACKDROP } from "../assets/backdrops";
import { TRIAL_CARD_PORTRAIT_SIZE } from "../assets/portraits";
import { accrueIdle } from "../idle/settle";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { getTrialStage, TRIAL_STAGES } from "../trial/catalog";
import {
  isTrialStageUnlocked,
  nextUnlockedStageId,
  trialStageStatus,
  trialStatusLabel,
} from "../trial/state";
import { addLockGlyph, makeButton, mountBackdrop } from "../ui/chrome";
import { addStandingPlate } from "../ui/portraitView";
import { COLORS, FONT, PALETTE } from "../ui/theme";

export class TrialSelectScene extends Phaser.Scene {
  private save!: SaveData;
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super("TrialSelect");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    mountBackdrop(this, BACKDROP.trial, { top: 160, bottom: 200, scrim: 0.62 });

    this.add
      .text(width / 2, 52, "试炼", {
        fontFamily: FONT,
        fontSize: "40px",
        color: COLORS.text,
      })
      .setOrigin(0.5)
      .setDepth(6);

    const next = getTrialStage(nextUnlockedStageId(this.save.trial.highestCleared));
    const progress =
      this.save.trial.highestCleared >= TRIAL_STAGES.length
        ? "三关均已通关"
        : this.save.trial.highestCleared === 0
          ? `下一关  第${next.id}关 ${next.name}`
          : `已通第${this.save.trial.highestCleared}关  ·  下一关 第${next.id}关 ${next.name}`;
    this.add
      .text(width / 2, 100, progress, {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.heroHex,
        align: "center",
        wordWrap: { width: 640 },
      })
      .setOrigin(0.5)
      .setDepth(6);

    TRIAL_STAGES.forEach((stage, index) => {
      this.drawStageCard(stage.id, 310 + index * 292);
    });

    this.hint = this.add
      .text(width / 2, height - 168, "", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5)
      .setDepth(6);

    makeButton(this, width / 2, height - 88, 280, 72, "返回洞府", () => {
      persistSave(this.save);
      this.scene.start("Hub");
    }, { tone: "gold", fontSize: 26, depth: 8 });
  }

  private drawStageCard(stageId: number, y: number): void {
    const { width } = this.scale;
    const stage = getTrialStage(stageId);
    const status = trialStageStatus(this.save.trial.highestCleared, stage.id);
    const unlocked = isTrialStageUnlocked(this.save.trial.highestCleared, stage.id);
    const isNext = status === "next";
    const cardW = 660;
    const cardH = 268;

    const root = this.add.container(width / 2, y).setDepth(4);
    const bg = this.add
      .rectangle(0, 0, cardW, cardH, PALETTE.ink, unlocked ? 0.9 : 0.72)
      .setStrokeStyle(2, isNext ? PALETTE.cinnabar : PALETTE.gold)
      .setInteractive({ useHandCursor: true });
    root.add(bg);

    const plate = addStandingPlate(
      this,
      width / 2 - 200,
      y + 112,
      stage.enemies[0]?.portraitKey,
      TRIAL_CARD_PORTRAIT_SIZE,
      { depth: 5, stroke: isNext ? PALETTE.cinnabar : PALETTE.gold },
    );
    plate.frame.setDepth(5);
    plate.portrait?.setDepth(6);
    if (!unlocked) {
      plate.frame.setAlpha(0.45);
      plate.portrait?.setAlpha(0.45);
      bg.setAlpha(0.55);
    }

    const textX = 90;
    const title = this.add
      .text(textX, -78, `第${stage.id}关  ${stage.name}`, {
        fontFamily: FONT,
        fontSize: "28px",
        color: COLORS.text,
      })
      .setOrigin(0.5);
    const enemyNames = stage.enemies.map((enemy) => enemy.name).join(" / ");
    const meta = this.add
      .text(textX, -32, `${enemyNames}  ·  血 ${stage.enemies[0]?.hp ?? 0} 起`, {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);
    const reward = this.add
      .text(textX, 2, `胜利 ${stage.stones} 灵石`, {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.log,
      })
      .setOrigin(0.5);
    const tag = this.add
      .text(textX, 36, trialStatusLabel(status), {
        fontFamily: FONT,
        fontSize: "16px",
        color: unlocked ? COLORS.heroHex : COLORS.muted,
      })
      .setOrigin(0.5);
    root.add([title, meta, reward, tag]);

    bg.on("pointerdown", () => this.tryEnter(stage.id));

    if (unlocked) {
      makeButton(this, width / 2 + 90, y + 82, 200, 64, "挑战", () => this.tryEnter(stage.id), {
        tone: isNext ? "cinnabar" : "gold",
        fontSize: 26,
        depth: 7,
      });
      return;
    }

    addLockGlyph(this, width / 2 + 90, y + 78, 7);
    root.setAlpha(0.92);
  }

  private tryEnter(stageId: number): void {
    if (!isTrialStageUnlocked(this.save.trial.highestCleared, stageId)) {
      this.hint?.setColor(COLORS.muted);
      this.hint?.setText(`需先通关第${stageId - 1}关，才能挑战第${stageId}关`);
      return;
    }
    const { save } = accrueIdle(this.save);
    this.save = save;
    persistSave(this.save);
    this.scene.start("Battle", { mode: "trial", stageId });
  }
}
