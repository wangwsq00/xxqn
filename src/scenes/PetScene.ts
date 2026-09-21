import Phaser from "phaser";
import { PET_LIST_PORTRAIT_SIZE, PET_SLOT_PORTRAIT_SIZE } from "../assets/portraits";
import { getPetDef } from "../pet/catalog";
import { derivePetStats, equipPet, isPetEquipped, unequipPet, unequippedOwned } from "../pet/state";
import { loadSave, persistSave, type SaveData } from "../save/storage";
import { addFramedPortrait } from "../ui/portraitView";
import { COLORS, FONT } from "../ui/theme";

export class PetScene extends Phaser.Scene {
  private save!: SaveData;
  private hint?: Phaser.GameObjects.Text;

  constructor() {
    super("Pet");
  }

  create(): void {
    this.save = loadSave();
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.bg);

    this.add
      .text(width / 2, 64, "灵宠", {
        fontFamily: FONT,
        fontSize: "40px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 108, "出战占我方 2 号位 · 主角仍居中 · 灵宠只普攻", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
      })
      .setOrigin(0.5);

    this.drawSlot();
    this.drawOwned();

    this.add
      .text(width / 2, 980, "开局已获得灵狐。穿戴写入 LocalStorage。", {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 600 },
      })
      .setOrigin(0.5);

    this.hint = this.add
      .text(width / 2, 1040, "点已有灵宠出战，再点出战槽卸下。未出战则试炼仍只上主角。", {
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

    const pendingHint = this.registry.get("petHint") as { text: string; ok?: boolean } | undefined;
    if (pendingHint?.text) {
      this.hint?.setText(pendingHint.text);
      this.hint?.setColor(pendingHint.ok ? COLORS.win : COLORS.muted);
      this.registry.set("petHint", undefined);
    }
  }

  private drawSlot(): void {
    const { width } = this.scale;
    const equippedId = this.save.pets.equippedId;
    const def = equippedId ? getPetDef(equippedId) : undefined;
    const filled = Boolean(def);
    const x = width / 2;
    const y = 250;
    const bg = this.add
      .rectangle(x, y, 560, 180, filled ? COLORS.ally : COLORS.empty, filled ? 1 : 0.9)
      .setStrokeStyle(2, filled ? 0x9ed4ea : COLORS.panelStroke);

    this.add
      .text(x - 40, y - 62, "出战槽 · 我方 2 号位", {
        fontFamily: FONT,
        fontSize: "16px",
        color: filled ? COLORS.text : COLORS.muted,
      })
      .setOrigin(0.5);

    addFramedPortrait(this, x - 190, y + 8, def?.portraitKey, PET_SLOT_PORTRAIT_SIZE, {
      stroke: filled ? 0x9ed4ea : COLORS.panelStroke,
      fill: filled ? COLORS.ally : COLORS.empty,
    });

    this.add
      .text(x + 70, y - 18, def ? def.name : "空", {
        fontFamily: FONT,
        fontSize: "32px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const sub = def
      ? `${def.gradeLabel} · ${def.typeLabel} · 点击卸下`
      : "可装备已有灵宠；主角始终占 1 号中位";
    this.add
      .text(x + 70, y + 28, sub, {
        fontFamily: FONT,
        fontSize: "16px",
        color: COLORS.muted,
        align: "center",
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    if (def) {
      const stats = derivePetStats(def, this.save.player.realmMajor);
      this.add
        .text(x + 70, y + 64, `血 ${stats.hp}  ·  攻 ${stats.atk}  ·  防 ${stats.def}  ·  速 ${stats.spd}`, {
          fontFamily: FONT,
          fontSize: "15px",
          color: COLORS.heroHex,
        })
        .setOrigin(0.5);
      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.unequip());
    }
  }

  private drawOwned(): void {
    const { width } = this.scale;
    this.add.rectangle(width / 2, 680, 620, 300, COLORS.panel).setStrokeStyle(2, COLORS.panelStroke);
    this.add
      .text(width / 2, 548, "已有灵宠", {
        fontFamily: FONT,
        fontSize: "22px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    const owned = this.save.pets.owned
      .map((id) => getPetDef(id))
      .filter((def): def is NonNullable<typeof def> => Boolean(def));

    owned.forEach((def, index) => {
      const y = 640 + index * 110;
      const available = unequippedOwned(this.save.pets).includes(def.id);
      const equipped = isPetEquipped(this.save.pets, def.id);
      const bg = this.add.rectangle(width / 2, y, 560, 96, available ? COLORS.hero : COLORS.empty);
      if (available) {
        bg.setInteractive({ useHandCursor: true });
        bg.on("pointerdown", () => this.equip(def.id));
      }
      addFramedPortrait(this, width / 2 - 220, y, def.portraitKey, PET_LIST_PORTRAIT_SIZE, {
        stroke: available ? 0x3a2a08 : COLORS.panelStroke,
        fill: available ? COLORS.hero : COLORS.empty,
      });
      const titleColor = available ? "#1a1204" : COLORS.text;
      this.add
        .text(width / 2 + 28, y - 22, `${def.name}  ·  ${def.gradeLabel}`, {
          fontFamily: FONT,
          fontSize: "22px",
          color: titleColor,
        })
        .setOrigin(0.5);
      const stats = derivePetStats(def, this.save.player.realmMajor);
      const sub = equipped
        ? "已出战我方 2 号位"
        : `${def.summary}  血${stats.hp} 攻${stats.atk}  点击出战`;
      this.add
        .text(width / 2 + 28, y + 18, sub, {
          fontFamily: FONT,
          fontSize: "14px",
          color: available ? "#3a2a08" : COLORS.muted,
          align: "center",
          wordWrap: { width: 400 },
        })
        .setOrigin(0.5);
    });
  }

  private persistAndReload(hint: string, ok: boolean): void {
    persistSave(this.save);
    this.registry.set("petHint", { text: hint, ok });
    this.scene.restart();
  }

  private equip(defId: string): void {
    const def = getPetDef(defId);
    this.save = {
      ...this.save,
      pets: equipPet(this.save.pets, defId),
    };
    this.persistAndReload(def ? `已令「${def.name}」出战。进入试炼将占据我方 2 号位。` : "已出战。", true);
  }

  private unequip(): void {
    const defId = this.save.pets.equippedId;
    const def = defId ? getPetDef(defId) : undefined;
    this.save = {
      ...this.save,
      pets: unequipPet(this.save.pets),
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
