import Phaser from "phaser";
import { BACKDROP, BACKDROP_FILES } from "../assets/backdrops";
import { preloadPresentation } from "../assets/presentation";
import { mountBackdrop } from "../ui/chrome";
import { preloadPortraits } from "../ui/portraitView";
import { COLORS, FONT } from "../ui/theme";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    preloadPortraits(this);
    preloadPresentation(this);
    for (const file of BACKDROP_FILES) {
      this.load.image(file.key, file.path);
    }
  }

  create(): void {
    const { width, height } = this.scale;
    mountBackdrop(this, BACKDROP.dongfu, { top: 280, bottom: 280, scrim: 0.45 });

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

    this.time.delayedCall(400, () => {
      this.scene.start("Hub");
    });
  }
}
