import { EMPTY_GEAR, getItemDef, STARTER_SWORD_INSTANCE_ID, WOODEN_SWORD_DEF_ID } from "./catalog";
import type { EquipSlotId, EquippedMap, GearBonus, SaveEquipment, SaveItem } from "./types";

export function emptyEquipment(): SaveEquipment {
  return { equipped: {}, items: [] };
}

export function starterEquipment(): SaveEquipment {
  return {
    equipped: {},
    items: [{ id: STARTER_SWORD_INSTANCE_ID, defId: WOODEN_SWORD_DEF_ID }],
  };
}

export function ownsDef(equipment: SaveEquipment, defId: string): boolean {
  return equipment.items.some((item) => item.defId === defId);
}

export function wornInstanceIds(equipped: EquippedMap): Set<string> {
  return new Set(Object.values(equipped).filter((id): id is string => Boolean(id)));
}

export function bagItems(equipment: SaveEquipment): SaveItem[] {
  const worn = wornInstanceIds(equipment.equipped);
  return equipment.items.filter((item) => !worn.has(item.id));
}

export function findItem(equipment: SaveEquipment, itemId: string): SaveItem | undefined {
  return equipment.items.find((item) => item.id === itemId);
}

export function equippedItem(equipment: SaveEquipment, slot: EquipSlotId): SaveItem | undefined {
  const itemId = equipment.equipped[slot];
  return itemId ? findItem(equipment, itemId) : undefined;
}

export function equippedWeaponName(equipment: SaveEquipment): string | undefined {
  const item = equippedItem(equipment, "weapon");
  return item ? getItemDef(item.defId)?.name : undefined;
}

export function gearBonusFromEquipment(equipment: SaveEquipment): GearBonus {
  const bonus: GearBonus = { ...EMPTY_GEAR };
  for (const itemId of Object.values(equipment.equipped)) {
    if (!itemId) {
      continue;
    }
    const item = findItem(equipment, itemId);
    if (!item) {
      continue;
    }
    const def = getItemDef(item.defId);
    if (!def) {
      continue;
    }
    bonus.atk += def.stats.atk ?? 0;
    bonus.def += def.stats.def ?? 0;
    bonus.hp += def.stats.hp ?? 0;
    bonus.spd += def.stats.spd ?? 0;
  }
  return bonus;
}

export function equipItem(equipment: SaveEquipment, itemId: string): SaveEquipment {
  const item = findItem(equipment, itemId);
  if (!item) {
    return equipment;
  }
  const def = getItemDef(item.defId);
  if (!def) {
    return equipment;
  }
  return {
    ...equipment,
    equipped: { ...equipment.equipped, [def.slot]: itemId },
    items: [...equipment.items],
  };
}

export function unequipSlot(equipment: SaveEquipment, slot: EquipSlotId): SaveEquipment {
  const next: EquippedMap = { ...equipment.equipped };
  delete next[slot];
  return {
    ...equipment,
    equipped: next,
    items: [...equipment.items],
  };
}

export function grantWoodenSwordIfMissing(
  equipment: SaveEquipment,
  instanceId = `itm-wooden-sword-drop`,
): { equipment: SaveEquipment; granted: boolean } {
  if (ownsDef(equipment, WOODEN_SWORD_DEF_ID)) {
    return { equipment, granted: false };
  }
  return {
    equipment: {
      ...equipment,
      equipped: { ...equipment.equipped },
      items: [...equipment.items, { id: instanceId, defId: WOODEN_SWORD_DEF_ID }],
    },
    granted: true,
  };
}

export function migrateEquipment(raw: unknown): SaveEquipment {
  if (!raw || typeof raw !== "object") {
    return starterEquipment();
  }
  const parsed = raw as Partial<SaveEquipment>;
  const items = Array.isArray(parsed.items)
    ? parsed.items.filter(
        (item): item is SaveItem =>
          Boolean(item) && typeof item.id === "string" && typeof item.defId === "string",
      )
    : [];
  const equipped: EquippedMap = {};
  if (parsed.equipped && typeof parsed.equipped === "object") {
    for (const [slot, itemId] of Object.entries(parsed.equipped)) {
      if (typeof itemId === "string" && items.some((item) => item.id === itemId)) {
        equipped[slot as EquipSlotId] = itemId;
      }
    }
  }
  const next: SaveEquipment = { equipped, items };
  if (!ownsDef(next, WOODEN_SWORD_DEF_ID)) {
    return grantWoodenSwordIfMissing(next, STARTER_SWORD_INSTANCE_ID).equipment;
  }
  return next;
}
