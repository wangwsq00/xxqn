import type { EquipSlotId, GearBonus, ItemDef } from "./types";

/** 文档未给装备数值。M1 保守默认：木剑装备攻击力 +12（炼气基础攻 100 的 12%）。 */
export const WOODEN_SWORD_ATK = 12;
export const WOODEN_SWORD_DEF_ID = "wooden-sword";
export const STARTER_SWORD_INSTANCE_ID = "itm-wooden-sword-starter";

export const EMPTY_GEAR: GearBonus = { atk: 0, def: 0, hp: 0, spd: 0 };

export const EQUIP_SLOT_LABELS: Record<EquipSlotId, string> = {
  weapon: "武器",
  chest: "上衣",
  legs: "下装",
  boots: "鞋子",
  accessoryL: "首饰（左）",
  accessoryR: "首饰（右）",
};

export const ITEM_DEFS: Record<string, ItemDef> = {
  [WOODEN_SWORD_DEF_ID]: {
    id: WOODEN_SWORD_DEF_ID,
    name: "木剑",
    slot: "weapon",
    weaponType: "剑",
    realm: "炼气境",
    stats: { atk: WOODEN_SWORD_ATK },
    flavor: "开局木剑，穿上后按角色公式叠加装备攻击力。",
  },
};

export function getItemDef(defId: string): ItemDef | undefined {
  return ITEM_DEFS[defId];
}
