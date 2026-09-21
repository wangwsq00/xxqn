import Phaser from "phaser";
import { COLORS, FONT } from "../ui/theme";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, height * 0.38, "修仙千年", {
        fontFamily: FONT,
        fontSize: "56px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.46, "挂机 · 养成 · 行动条战斗", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.62, "正在进入洞府…", {
        fontFamily: FONT,
        fontSize: "20px",
        color: COLORS.log,
      })
      .setOrigin(0.5);

    this.time.delayedCall(600, () => {
      this.scene.start("Hub");
    });
  }
}
