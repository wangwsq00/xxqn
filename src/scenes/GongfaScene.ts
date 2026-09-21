import Phaser from "phaser";
import { GONGFA_SLOT_LABELS, getGongfaDef } from "../gongfa/catalog";
import {
  equipGongfa,
  equippedSlotOf,
  unequipGongfaSlot,
  unequippedOwned,
} from "../gongfa/state";
import type { GongfaSlotIndex } from "../gongfa/types";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { COLORS, FONT } from "../ui/theme";

export class GongfaScene extends Phaser.Scene {
  private save!: SaveData;
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super("Gongfa");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, 64, "功法", {
        fontFamily: FONT,
        fontSize: "40px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 108, "1–4 号槽按序自动释放 · 冷却中或空槽则普通攻击", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.drawSlots();
    this.drawOwned();

    this.add
      .text(width / 2, 980, "5 号槽固定普通攻击，不可更换。穿戴写入 LocalStorage。", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    this.hint = this.add
      .text(width / 2, 1040, "点已有功法装入空槽，再点槽位卸下。未装备时试炼只出普攻。", {
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

    const pendingHint = this.registry.get("gongfaHint") as { text: string; ok?: boolean } | undefined;
    if (pendingHint?.text) {
      this.hint?.setText(pendingHint.text);
      this.hint?.setColor(pendingHint.ok ? COLORS.win : COLORS.muted);
      this.registry.set("gongfaHint", undefined);
    }
  }

  private drawSlots(): void {
    const { width } = this.scale;
    const startY = 168;
    for (let i = 0; i < 4; i += 1) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = width / 2 + (col === 0 ? -150 : 150);
      const y = startY + row * 118;
      this.drawSlotCard(i as GongfaSlotIndex, x, y);
    }
  }

  private drawSlotCard(slot: GongfaSlotIndex, x: number, y: number): void {
    const defId = this.save.gongfa.slots[slot];
    const def = defId ? getGongfaDef(defId) : undefined;
    const filled = Boolean(def);
    const bg = this.add
      .rectangle(x, y, 280, 100, filled ? COLORS.hero : COLORS.empty, filled ? 1 : 0.85)
      .setStrokeStyle(2, filled ? 0xfff3c4 : COLORS.panelStroke);

    this.add
      .text(x, y - 28, GONGFA_SLOT_LABELS[slot], {
        fontFamily: FONT,
        fontSize: "16px",
        color: filled ? "#1a1204" : COLORS.muted,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 4, def ? def.name : "空", {
        fontFamily: FONT,
        fontSize: "24px",
        color: filled ? "#1a1204" : COLORS.text,
      })
      .setOrigin(0.5);

    const sub = def ? `${def.gradeLabel} · 点击卸下` : "可装备已有功法";
    this.add
      .text(x, y + 32, sub, {
        fontFamily: FONT,
        fontSize: "14px",
        color: filled ? "#3a2a08" : COLORS.muted,
      })
      .setOrigin(0.5);

    if (filled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.unequip(slot));
    }
  }

  private drawOwned(): void {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 720, 620, 280, COLORS.panel).setStrokeStyle(2, COLORS.panelStroke);
    this.add
      .text(width / 2, 598, "已有功法", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const owned = this.save.gongfa.owned
      .map((id) => getGongfaDef(id))
      .filter((def): def is NonNullable<typeof def> => Boolean(def));

    owned.forEach((def, index) => {
      const equippedAt = equippedSlotOf(this.save.gongfa, def.id);
      const y = 668 + index * 100;
      const available = unequippedOwned(this.save.gongfa).includes(def.id);
      const bg = this.add.rectangle(width / 2, y, 560, 86, available ? COLORS.hero : COLORS.empty);
      if (available) {
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerdown", () => this.equip(def.id));
      }
      const titleColor = available ? "#1a1204" : COLORS.text;
      this.add
        .text(width / 2, y - 18, `${def.name}  ·  ${def.gradeLabel}`, {
          fontFamily: FONT,
          fontSize: "22px",
          color: titleColor,
        })
        .setOrigin(0.5);
      const sub =
        equippedAt !== null
          ? `已装备 ${GONGFA_SLOT_LABELS[equippedAt]}`
          : `${def.summary}  点击装备`;
      this.add
        .text(width / 2, y + 16, sub, {
          fontFamily: FONT,
          fontSize: "14px",
          color: available ? "#3a2a08" : COLORS.muted,
          align: "center",
          wordWrap: { width: 520 },
        })
        .setOrigin(0.5);
    });
  }

  private persistAndReload(hint: string, ok: boolean): void {
    persistSave(this.save);
    this.registry.set("gongfaHint", { text: hint, ok });
    this.scene.restart();
  }

  private equip(defId: string): void {
    const def = getGongfaDef(defId);
    this.save = {
      ...this.save,
      gongfa: equipGongfa(this.save.gongfa, defId),
    };
    this.persistAndReload(
      def ? `已装备「${def.name}」。进入试炼后冷却结束会自动释放。` : "已装备。",
      true,
    );
  }

  private unequip(slot: GongfaSlotIndex): void {
    const defId = this.save.gongfa.slots[slot];
    const def = defId ? getGongfaDef(defId) : undefined;
    this.save = {
      ...this.save,
      gongfa: unequipGongfaSlot(this.save.gongfa, slot),
    };
    this.persistAndReload(def ? `已卸下「${def.name}」。` : "已卸下。", false);
  }

  private makeButton(x: number, y: number, label: string, onClick: () => void): void {
    const bg = this.add.rectangle(x, y, 360, 72, COLORS.hero).setInteractive({ useHandCursor: true });
    this.add
      .text(x, y, label, {
        fontFamily: FONT,
        fontSize: "28px",
        color: "#1a1204",
      })
      .setOrigin(0.5)
      .setDepth(1);
    bg.on("pointerdown", onClick);
    bg.on("pointerover", () => bg.setFillStyle(0xe8b84a));
    bg.on("pointerout", () => bg.setFillStyle(COLORS.hero));
  }
}
