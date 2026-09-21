import Phaser from "phaser";
import { MAX_OFFLINE_SECONDS } from "../idle/constants";
import { qiPerSecond, stonesPerMinute } from "../idle/rates";
import {
  accrueIdle,
  claimableAmounts,
  claimIdle,
  formatDuration,
  hasClaimable,
  trimRate,
} from "../idle/settle";
import { isPeakMinorLayer } from "../realm/costs";
import { cultivationProgressText, cultivationRatio } from "../realm/format";
import { applyMinorLayerUps } from "../realm/upgrade";
import { canChallengeHeartDemon, heartDemonHint } from "../realm/breakthrough";
import { loadSave, persistSave, realmLabel, type SaveData } from "../save/storage";
import { COLORS, FONT } from "../ui/theme";

const QI_BAR_W = 360;

export class HubScene extends Phaser.Scene {
  private save!: SaveData;
  private realmText?: Phaser.GameObjects.Text;
  private progressText?: Phaser.GameObjects.Text;
  private breakthroughHint?: Phaser.GameObjects.Text;
  private qiBar?: Phaser.GameObjects.Rectangle;
  private walletText?: Phaser.GameObjects.Text;
  private rateText?: Phaser.GameObjects.Text;
  private pendingText?: Phaser.GameObjects.Text;
  private offlineText?: Phaser.GameObjects.Text;
  private claimHint?: Phaser.GameObjects.Text;
  private claimBg?: Phaser.GameObjects.Rectangle;
  private claimLabel?: Phaser.GameObjects.Text;
  private demonBg?: Phaser.GameObjects.Rectangle;
  private demonLabel?: Phaser.GameObjects.Text;
  private onVisibility?: () => void;

  constructor() {
    super("Hub");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, 72, "修仙千年", {
        fontFamily: FONT,
        fontSize: "48px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 128, "洞府", {
        fontFamily: FONT,
        fontSize: "24px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, 372, 600, 430, COLORS.panel).setStrokeStyle(2, COLORS.panelStroke);

    this.realmText = this.add
      .text(width / 2, 188, "", {
        fontFamily: FONT,
        fontSize: "32px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.progressText = this.add
      .text(width / 2, 228, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.heroHex,
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, 258, QI_BAR_W, 12, COLORS.hpBg);
    this.qiBar = this.add.rectangle(width / 2 - QI_BAR_W / 2, 258, QI_BAR_W, 12, COLORS.atb).setOrigin(0, 0.5);

    this.breakthroughHint = this.add
      .text(width / 2, 282, "", {
        fontFamily: FONT,
        fontSize: "15px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);

    this.walletText = this.add
      .text(width / 2, 312, "", {
        fontFamily: FONT,
        fontSize: "24px",
        color: COLORS.log,
      })
      .setOrigin(0.5);

    this.rateText = this.add
      .text(width / 2, 356, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.muted,
        align: "center",
      })
      .setOrigin(0.5);

    this.pendingText = this.add
      .text(width / 2, 408, "", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.heroHex,
      })
      .setOrigin(0.5);

    this.offlineText = this.add
      .text(width / 2, 458, "", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 540 },
      })
      .setOrigin(0.5);

    this.claimHint = this.add
      .text(width / 2, 512, "本地存档已启用 · 挂机收益写入浏览器 LocalStorage", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);

    this.makeClaimButton(width / 2, 580);
    this.makeButton(width / 2 - 220, 650, "聚灵阵", () => {
      const { save } = accrueIdle(this.save);
      this.save = save;
      persistSave(this.save);
      this.scene.start("Gathering");
    }, 200);
    this.makeButton(width / 2, 650, "装备", () => {
      const { save } = accrueIdle(this.save);
      this.save = save;
      persistSave(this.save);
      this.scene.start("Equip");
    }, 200);
    this.makeButton(width / 2 + 220, 650, "功法", () => {
      const { save } = accrueIdle(this.save);
      this.save = save;
      persistSave(this.save);
      this.scene.start("Gongfa");
    }, 200);
    this.makeButton(width / 2 - 190, 740, "进入试炼", () => {
      this.persistThenBattle("trial");
    }, 280);
    this.makeDemonButton(width / 2 + 190, 740);

    this.add
      .text(width / 2, height - 72, "阵容：主角固定我方 1 号中位 · 5v5 空位可空", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

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

  private refreshIdle(): void {
    const { save } = accrueIdle(this.save);
    const cultivated = applyMinorLayerUps(save);
    this.save = cultivated.save;
    persistSave(this.save);
    this.paint();
  }

  private paint(): void {
    const { realmMajor, realmLayer, gatheringArrayLevel, lingqi, stones } = this.save.player;
    const pending = claimableAmounts(this.save);
    const qiRate = qiPerSecond(realmMajor, gatheringArrayLevel);
    const stoneRate = stonesPerMinute(realmMajor);
    const arrayHint =
      gatheringArrayLevel > 0 ? `聚灵阵 ${gatheringArrayLevel} 级` : "聚灵阵未布置";

    this.realmText?.setText(realmLabel(realmMajor, realmLayer));
    this.progressText?.setText(cultivationProgressText(realmMajor, realmLayer, lingqi));
    this.qiBar?.setScale(cultivationRatio(realmMajor, realmLayer, lingqi), 1);
    const demonReady = canChallengeHeartDemon(this.save);
    this.breakthroughHint?.setText(heartDemonHint(this.save));
    this.breakthroughHint?.setColor(demonReady ? COLORS.heroHex : COLORS.muted);
    this.demonBg?.setFillStyle(demonReady ? COLORS.hero : COLORS.empty);
    this.demonLabel?.setColor(demonReady ? "#1a1204" : COLORS.muted);
    this.walletText?.setText(`灵气 ${Math.floor(lingqi)}  ·  灵石 ${Math.floor(stones)}`);
    this.rateText?.setText(
      `修炼速率  ${trimRate(qiRate)} 灵气/秒  ·  ${trimRate(stoneRate)} 灵石/分钟\n${arrayHint}`,
    );
    this.pendingText?.setText(`待领取  灵气 ${pending.lingqi}  ·  灵石 ${pending.stones}`);

    const lastGap = this.save.idle.lastOfflineSeconds;
    const offlineLine =
      lastGap >= 60
        ? `上次间隔 ${formatDuration(lastGap)}${lastGap > MAX_OFFLINE_SECONDS ? "，超出 8 小时已丢弃" : ""}`
        : "洞府闲修中，离线回来可结算";
    this.offlineText?.setText(`离线结算最多 ${formatDuration(MAX_OFFLINE_SECONDS)}\n${offlineLine}`);

    const canClaim = hasClaimable(this.save);
    this.claimBg?.setFillStyle(canClaim ? COLORS.hero : COLORS.empty);
    this.claimLabel?.setText(canClaim ? "领取洞府收益" : "暂无收益可领");
    this.claimLabel?.setColor(canClaim ? "#1a1204" : COLORS.muted);
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
      this.claimHint?.setColor(COLORS.win);
      this.claimHint?.setText(lines.join("\n"));
    } else {
      this.claimHint?.setColor(COLORS.muted);
      this.claimHint?.setText("尚无整数收益，稍后再来");
    }
    this.paint();
  }

  private makeClaimButton(x: number, y: number): void {
    const bg = this.add.rectangle(x, y, 360, 72, COLORS.hero).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, "领取洞府收益", {
        fontFamily: FONT,
        fontSize: "28px",
        color: "#1a1204",
      })
      .setOrigin(0.5)
      .setDepth(1);
    bg.on("pointerdown", () => {
      bg.setFillStyle(0xf0d070);
      this.claimRewards();
    });
    bg.on("pointerover", () => {
      if (hasClaimable(this.save)) {
        bg.setFillStyle(0xe8b84a);
      }
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(hasClaimable(this.save) ? COLORS.hero : COLORS.empty);
    });
    this.claimBg = bg;
    this.claimLabel = text;
  }

  private persistThenBattle(mode: "trial" | "heartDemon"): void {
    const { save } = accrueIdle(this.save);
    this.save = save;
    persistSave(this.save);
    this.scene.start("Battle", { mode });
  }

  private makeDemonButton(x: number, y: number): void {
    const bg = this.add.rectangle(x, y, 280, 72, COLORS.empty).setInteractive({ useHandCursor: true });
    const text = this.add
      .text(x, y, "挑战心魔", {
        fontFamily: FONT,
        fontSize: "28px",
        color: COLORS.muted,
      })
      .setOrigin(0.5)
      .setDepth(1);
    bg.on("pointerdown", () => {
      if (!canChallengeHeartDemon(this.save)) {
        this.claimHint?.setColor(COLORS.muted);
        this.claimHint?.setText(
          isPeakMinorLayer(this.save.player.realmLayer)
            ? this.save.player.realmMajor >= 9
              ? "已至渡劫境九层，无法再破大境"
              : "灵气未满 100%，无法挑战心魔"
            : "需当前大境九层且灵气达 100% 方可挑战心魔",
        );
        return;
      }
      bg.setFillStyle(0xf0d070);
      this.persistThenBattle("heartDemon");
    });
    bg.on("pointerover", () => {
      if (canChallengeHeartDemon(this.save)) {
        bg.setFillStyle(0xe8b84a);
      }
    });
    bg.on("pointerout", () => {
      bg.setFillStyle(canChallengeHeartDemon(this.save) ? COLORS.hero : COLORS.empty);
    });
    this.demonBg = bg;
    this.demonLabel = text;
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void, width = 360): void {
    const bg = this.add.rectangle(x, y, width, 72, COLORS.hero).setInteractive({ useHandCursor: true });
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
