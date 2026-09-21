/** 与 `09_装备系统.md` 六部位一致，不用聊天稿三槽。 */
export const EQUIP_SLOT_IDS = [
  "weapon",
  "chest",
  "legs",
  "boots",
  "accessoryL",
  "accessoryR",
] as const;

export type EquipSlotId = (typeof EQUIP_SLOT_IDS)[number];

export interface GearBonus {
  atk: number;
  def: number;
  hp: number;
  spd: number;
}

export interface ItemDef {
  id: string;
  name: string;
  slot: EquipSlotId;
  /** 武器类型；非武器可省略。 */
  weaponType?: string;
  realm: string;
  stats: Partial<GearBonus>;
  flavor: string;
}

export interface SaveItem {
  id: string;
  defId: string;
}

export type EquippedMap = Partial<Record<EquipSlotId, string>>;

export interface SaveEquipment {
  equipped: EquippedMap;
  items: SaveItem[];
}
