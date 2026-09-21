import Phaser from "phaser";
import { loadSave, persistSave, realmLabel, settleIdle, type SaveData } from "../save/storage";
import { COLORS, FONT } from "../ui/theme";

export class HubScene extends Phaser.Scene {
  private save!: SaveData;
  private qiText?: Phaser.GameObjects.Text;

  constructor() {
    super("Hub");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, 88, "修仙千年", {
        fontFamily: FONT,
        fontSize: "48px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 150, "洞府", {
        fontFamily: FONT,
        fontSize: "24px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, 340, 560, 220, COLORS.panel).setStrokeStyle(2, COLORS.panelStroke);

    this.add
      .text(width / 2, 270, realmLabel(this.save.player.realmMajor, this.save.player.realmLayer), {
        fontFamily: FONT,
        fontSize: "32px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.qiText = this.add
      .text(width / 2, 330, "", {
        fontFamily: FONT,
        fontSize: "24px",
        color: COLORS.log,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 380, "聚灵中 · 炼气 1 灵气/秒（离线最多 8 小时）", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 430, "本地存档已启用", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.makeButton(width / 2, 560, "进入试炼", () => {
      persistSave(this.save);
      this.scene.start("Battle");
    });

    this.add
      .text(width / 2, height - 80, "阵容：主角固定我方 1 号中位 · 5v5 空位可空", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.refreshQi();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => this.refreshQi(),
    });
  }

  private refreshQi(): void {
    this.save = settleIdle(this.save);
    persistSave(this.save);
    this.qiText?.setText(`灵气 ${this.save.player.lingqi}  ·  灵石 ${this.save.player.stones}`);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 360, 72, COLORS.hero).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: "28px",
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
