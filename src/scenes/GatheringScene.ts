import Phaser from "phaser";
import {
  formatStoneCost,
  gatheringBonusPercent,
  nextGatheringCost,
  purchaseGathering,
} from "../idle/gathering";
import { qiPerSecond } from "../idle/rates";
import { accrueIdle, trimRate } from "../idle/settle";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { BACKDROP } from "../assets/backdrops";
import { makeButton, mountBackdrop, type UiButton } from "../ui/chrome";
import { COLORS, FONT, PALETTE } from "../ui/theme";

export class GatheringScene extends Phaser.Scene {
  private save!: SaveData;
  private walletText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private rateText?: Phaser.GameObjects.Text;
  private nextText?: Phaser.GameObjects.Text;
  private hint?: Phaser.GameObjects.Text;
  private actionBtn?: UiButton;

  constructor() {
    super("Gathering");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    mountBackdrop(this, BACKDROP.dongfu, { top: 140, bottom: 220, scrim: 0.78 });

    this.add
      .text(width / 2, 64, "聚灵阵", {
        fontFamily: FONT,
        fontSize: "40px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 112, "消耗灵石布置与升级，提高洞府灵气获取速度", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, 430, 620, 480, PALETTE.ink, 0.9).setStrokeStyle(2, PALETTE.gold);

    this.walletText = this.add
      .text(width / 2, 240, "", {
        fontFamily: FONT,
        fontSize: "24px",
        color: COLORS.log,
      })
      .setOrigin(0.5);

    this.statusText = this.add
      .text(width / 2, 320, "", {
        fontFamily: FONT,
        fontSize: "32px",
        color: COLORS.text,
        align: "center",
      })
      .setOrigin(0.5);

    this.rateText = this.add
      .text(width / 2, 400, "", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.heroHex,
        align: "center",
      })
      .setOrigin(0.5);

    this.nextText = this.add
      .text(width / 2, 500, "", {
        fontFamily: FONT,
        fontSize: "18px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 540 },
      })
      .setOrigin(0.5);

    this.hint = this.add
      .text(width / 2, 720, "消耗灵石布置或升级，返回洞府后灵气会加快。", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    this.actionBtn = makeButton(this, width / 2, 620, 520, 72, "布置聚灵阵", () => this.tryPurchase(), {
      tone: "cinnabar",
      fontSize: 26,
      depth: 6,
    });
    makeButton(this, width / 2, height - 88, 360, 72, "返回洞府", () => {
      const { save } = accrueIdle(this.save);
      this.save = save;
      persistSave(this.save);
      this.scene.start("Hub");
    }, { tone: "gold", fontSize: 28, depth: 6 });

    this.refresh();
  }

  private refresh(): void {
    const { save } = accrueIdle(this.save);
    this.save = save;
    persistSave(this.save);
    this.paint();
  }

  private paint(): void {
    const { gatheringArrayLevel, realmMajor, lingqi, stones } = this.save.player;
    const level = gatheringArrayLevel;
    const bonus = gatheringBonusPercent(level);
    const qiRate = qiPerSecond(realmMajor, level);
    const cost = nextGatheringCost(level);
    const nextLevel = level + 1;
    const nextBonus = gatheringBonusPercent(nextLevel);
    const nextRate = qiPerSecond(realmMajor, nextLevel);

    this.walletText?.setText(`灵气 ${Math.floor(lingqi)}  ·  灵石 ${Math.floor(stones)}`);
    this.statusText?.setText(
      level > 0 ? `聚灵阵 ${level} 级  ·  灵气 +${bonus}%` : "尚未布置聚灵阵",
    );
    this.rateText?.setText(`当前修炼  ${trimRate(qiRate)} 灵气/秒`);

    if (cost == null) {
      this.nextText?.setText("已达最高 10 级，灵气获取 +100%。");
      this.actionBtn?.setLabel("已满级");
      this.actionBtn?.setTone("quiet");
    } else {
      const action = level === 0 ? "布置 1 级" : `升级至 ${nextLevel} 级`;
      this.nextText?.setText(
        `${action}：${formatStoneCost(cost)}\n灵气加成 +${nextBonus}%  ·  ${trimRate(nextRate)} 灵气/秒`,
      );
      const canAfford = Math.floor(stones) >= cost;
      this.actionBtn?.setLabel(`${action}（${formatStoneCost(cost)}）`);
      this.actionBtn?.setTone(canAfford ? "cinnabar" : "quiet");
    }
  }

  private tryPurchase(): void {
    const result = purchaseGathering(this.save);
    this.save = result.save;
    persistSave(this.save);
    this.hint?.setText(result.message);
    this.hint?.setColor(result.ok ? COLORS.win : COLORS.lose);
    this.paint();
  }

}
