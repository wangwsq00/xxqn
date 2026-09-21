import Phaser from "phaser";
import { accrueIdle } from "../idle/settle";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { getTrialStage, TRIAL_STAGES } from "../trial/catalog";
import {
  isTrialStageUnlocked,
  nextUnlockedStageId,
  trialStageStatus,
  trialStatusLabel,
} from "../trial/state";
import { COLORS, FONT } from "../ui/theme";

export class TrialSelectScene extends Phaser.Scene {
  private save!: SaveData;
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super("TrialSelect");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, 64, "试炼", {
        fontFamily: FONT,
        fontSize: "40px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 112, "通关第 N 关解锁第 N+1 关 · 敌人与灵石随关卡增强", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    const next = getTrialStage(nextUnlockedStageId(this.save.trial.highestCleared));
    const progress =
      this.save.trial.highestCleared >= TRIAL_STAGES.length
        ? "已通最高：三关均已通关"
        : `已通最高：${this.save.trial.highestCleared === 0 ? "尚未通关" : `第${this.save.trial.highestCleared}关`} · 下一关 第${next.id}关`;
    this.add
      .text(width / 2, 152, progress, {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.heroHex,
      })
      .setOrigin(0.5);

    TRIAL_STAGES.forEach((stage, index) => {
      this.drawStageCard(stage.id, 248 + index * 210);
    });

    this.hint = this.add
      .text(width / 2, 900, "点已解锁关卡进入战斗。失败不发灵石，可重复挑战已通关卡。", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    this.makeButton(width / 2, height - 88, "返回洞府", () => {
      persistSave(this.save);
      this.scene.start("Hub");
    });
  }

  private drawStageCard(stageId: number, y: number): void {
    const { width } = this.scale;
    const stage = getTrialStage(stageId);
    const status = trialStageStatus(this.save.trial.highestCleared, stage.id);
    const unlocked = isTrialStageUnlocked(this.save.trial.highestCleared, stage.id);
    const isNext = status === "next";
    const bg = this.add
      .rectangle(width / 2, y, 620, 186, isNext ? 0x2a2410 : COLORS.panel)
      .setStrokeStyle(2, isNext ? COLORS.hero : COLORS.panelStroke)
      .setInteractive({ useHandCursor: unlocked });

    this.add
      .text(width / 2, y - 62, `第${stage.id}关  ${stage.name}`, {
        fontFamily: FONT,
        fontSize: "26px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const enemyNames = stage.enemies.map((enemy) => enemy.name).join(" / ");
    this.add
      .text(width / 2, y - 24, `敌人 ${enemyNames}  ·  血 ${stage.enemies[0]?.hp ?? 0} 起`, {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, y + 8, `胜利 ${stage.stones} 灵石`, {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.log,
      })
      .setOrigin(0.5);

    const action = unlocked ? (status === "cleared" ? "再次挑战" : "进入战斗") : "未解锁";
    this.add
      .text(width / 2, y + 48, `${trialStatusLabel(status)}  ·  ${action}`, {
        fontFamily: FONT,
        fontSize: "18px",
        color: unlocked ? COLORS.heroHex : COLORS.muted,
      })
      .setOrigin(0.5);

    bg.on("pointerdown", () => this.tryEnter(stage.id));
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

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 280, 64, COLORS.hero).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: "24px",
        color: "#1a1204",
      })
      .setOrigin(0.5);
    bg.on("pointerdown", () => {
      bg.setFillStyle(0xf0d070);
      onClick();
    });
    bg.on("pointerover", () => bg.setFillStyle(0xe8b84a));
    bg.on("pointerout", () => bg.setFillStyle(COLORS.hero));
    text.setDepth(1);
  }
}
