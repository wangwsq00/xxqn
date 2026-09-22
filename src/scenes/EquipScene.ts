import Phaser from "phaser";
import { EQUIP_SLOT_LABELS, getItemDef, WOODEN_SWORD_ATK } from "../equip/catalog";
import {
  bagItems,
  equipItem,
  equippedItem,
  gearBonusFromEquipment,
  unequipSlot,
} from "../equip/state";
import { EQUIP_SLOT_IDS, type EquipSlotId } from "../equip/types";
import { deriveCombatStats, realmBaseStat } from "../combat/factory";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { BACKDROP } from "../assets/backdrops";
import { makeButton, mountBackdrop } from "../ui/chrome";
import { COLORS, FONT, PALETTE } from "../ui/theme";

export class EquipScene extends Phaser.Scene {
  private save!: SaveData;
  private hint?: Phaser.GameObjects.Text;
  private atkText?: Phaser.GameObjects.Text;

  constructor() {
    super("Equip");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    mountBackdrop(this, BACKDROP.dongfu, { top: 160, bottom: 220, scrim: 0.8 });

    this.add
      .text(width / 2, 64, "装备", {
        fontFamily: FONT,
        fontSize: "40px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 108, "六部位占位 · 穿戴武器按角色公式加攻击", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.drawSlots();
    this.drawBag();

    this.atkText = this.add
      .text(width / 2, 980, "", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.heroHex,
        align: "center",
      })
      .setOrigin(0.5);

    this.hint = this.add
      .text(width / 2, 1040, "点背包中的木剑穿上，再点槽位卸下。", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    makeButton(this, width / 2, height - 88, 360, 72, "返回洞府", () => {
      persistSave(this.save);
      this.scene.start("Hub");
    }, { tone: "gold", fontSize: 28, depth: 8 });

    this.refreshStats();
    const pendingHint = this.registry.get("equipHint") as { text: string; ok?: boolean } | undefined;
    if (pendingHint?.text) {
      this.hint?.setText(pendingHint.text);
      this.hint?.setColor(pendingHint.ok ? COLORS.win : COLORS.muted);
      this.registry.set("equipHint", undefined);
    }
  }

  private drawSlots(): void {
    const { width } = this.scale;
    const startY = 168;
    EQUIP_SLOT_IDS.forEach((slot, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = width / 2 + (col === 0 ? -150 : 150);
      const y = startY + row * 118;
      this.drawSlotCard(slot, x, y);
    });
  }

  private drawSlotCard(slot: EquipSlotId, x: number, y: number): void {
    const worn = equippedItem(this.save.equipment, slot);
    const def = worn ? getItemDef(worn.defId) : undefined;
    const filled = Boolean(def);
    const bg = this.add
      .rectangle(x, y, 280, 100, filled ? PALETTE.gold : PALETTE.ink, filled ? 1 : 0.88)
      .setStrokeStyle(2, filled ? PALETTE.stroke : PALETTE.gold);

    this.add
      .text(x, y - 28, EQUIP_SLOT_LABELS[slot], {
        fontFamily: FONT,
        fontSize: "16px",
        color: filled ? COLORS.strokeHex : COLORS.muted,
      })
      .setOrigin(0.5);

    this.add
      .text(x, y + 4, def ? def.name : "空", {
        fontFamily: FONT,
        fontSize: "24px",
        color: filled ? COLORS.strokeHex : COLORS.text,
      })
      .setOrigin(0.5);

    const sub = def
      ? `攻击 +${def.stats.atk ?? 0} · 点击卸下`
      : slot === "weapon"
        ? "可装备背包中的木剑"
        : "暂无装备";
    this.add
      .text(x, y + 32, sub, {
        fontFamily: FONT,
        fontSize: "14px",
        color: filled ? COLORS.strokeHex : COLORS.muted,
      })
      .setOrigin(0.5);

    if (filled) {
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.unequip(slot));
    }
  }

  private drawBag(): void {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 720, 620, 220, PALETTE.ink, 0.9).setStrokeStyle(2, PALETTE.gold);
    this.add
      .text(width / 2, 630, "背包", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const bag = bagItems(this.save.equipment);
    if (bag.length === 0) {
      const wornHint =
        this.save.equipment.items.length > 0
          ? "木剑正在穿戴，点武器槽可卸下。"
          : "背包空。试炼胜利会掉落木剑（已拥有则不再掉）。";
      this.add
        .text(width / 2, 720, wornHint, {
          fontFamily: FONT,
          fontSize: "16px",
          color: COLORS.muted,
          align: "center",
          wordWrap: { width: 540 },
        })
        .setOrigin(0.5);
      return;
    }

    bag.forEach((item, index) => {
      const def = getItemDef(item.defId);
      const y = 700 + index * 72;
      const bg = this.add
        .rectangle(width / 2, y, 540, 60, PALETTE.cinnabar)
        .setStrokeStyle(2, PALETTE.gold)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(width / 2, y, `${def?.name ?? item.defId}  ·  攻击 +${def?.stats.atk ?? 0}  ·  点击装备`, {
          fontFamily: FONT,
          fontSize: "20px",
          color: COLORS.body,
        })
        .setOrigin(0.5);
      bg.on("pointerdown", () => this.equip(item.id));
    });
  }

  private refreshStats(): void {
    const gear = gearBonusFromEquipment(this.save.equipment);
    const stats = deriveCombatStats(this.save.player.realmMajor, undefined, gear);
    const extra = gear.atk > 0
      ? `（基础 ${realmBaseStat(this.save.player.realmMajor)} + 装备 ${gear.atk}）`
      : "（未穿武器）";
    this.atkText?.setText(`当前攻击 ${stats.atk} ${extra}\n木剑 M1 默认 +${WOODEN_SWORD_ATK} 攻`);
  }

  private persistAndReload(hint: string, ok: boolean): void {
    persistSave(this.save);
    this.registry.set("equipHint", { text: hint, ok });
    this.scene.restart();
  }

  private equip(itemId: string): void {
    this.save = {
      ...this.save,
      equipment: equipItem(this.save.equipment, itemId),
    };
    this.persistAndReload("已装备木剑。进入试炼后主角攻击会提高。", true);
  }

  private unequip(slot: EquipSlotId): void {
    this.save = {
      ...this.save,
      equipment: unequipSlot(this.save.equipment, slot),
    };
    this.persistAndReload("已卸下。攻击恢复为基础值。", false);
  }

}
