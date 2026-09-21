import { describe, expect, it } from "vitest";
import { deriveCombatStats } from "../combat/factory";
import { EMPTY_GEAR, WOODEN_SWORD_ATK, WOODEN_SWORD_DEF_ID } from "./catalog";
import {
  bagItems,
  equipItem,
  equippedWeaponName,
  gearBonusFromEquipment,
  grantWoodenSwordIfMissing,
  migrateEquipment,
  starterEquipment,
  unequipSlot,
} from "./state";

describe("equipment catalog and slots", () => {
  it("starts with an unequipped wooden sword in the bag", () => {
    const eq = starterEquipment();
    expect(eq.items).toHaveLength(1);
    expect(eq.items[0].defId).toBe(WOODEN_SWORD_DEF_ID);
    expect(eq.equipped.weapon).toBeUndefined();
    expect(bagItems(eq)).toHaveLength(1);
  });

  it("equipping the wooden sword raises derived ATK by the M1 default", () => {
    const eq = equipItem(starterEquipment(), starterEquipment().items[0].id);
    expect(eq.equipped.weapon).toBe(eq.items[0].id);
    expect(bagItems(eq)).toHaveLength(0);
    expect(equippedWeaponName(eq)).toBe("木剑");
    const bonus = gearBonusFromEquipment(eq);
    expect(bonus.atk).toBe(WOODEN_SWORD_ATK);
    const bare = deriveCombatStats(1);
    const armed = deriveCombatStats(1, undefined, bonus);
    expect(bare.atk).toBe(100);
    expect(armed.atk).toBe(100 + WOODEN_SWORD_ATK);
    expect(armed.hp).toBe(bare.hp);
  });

  it("unequipping returns the sword to the bag and clears the ATK bonus", () => {
    const equipped = equipItem(starterEquipment(), starterEquipment().items[0].id);
    const cleared = unequipSlot(equipped, "weapon");
    expect(cleared.equipped.weapon).toBeUndefined();
    expect(bagItems(cleared)).toHaveLength(1);
    expect(gearBonusFromEquipment(cleared)).toEqual(EMPTY_GEAR);
  });

  it("trial drop is idempotent when the starter sword already exists", () => {
    const first = grantWoodenSwordIfMissing(starterEquipment());
    expect(first.granted).toBe(false);
    const fromEmpty = grantWoodenSwordIfMissing({ equipped: {}, items: [] }, "itm-drop");
    expect(fromEmpty.granted).toBe(true);
    expect(fromEmpty.equipment.items[0].id).toBe("itm-drop");
  });

  it("migrates missing equipment onto a starter wooden sword", () => {
    const migrated = migrateEquipment(undefined);
    expect(migrated.items[0].defId).toBe(WOODEN_SWORD_DEF_ID);
    const keep = migrateEquipment({
      equipped: { weapon: "keep-1" },
      items: [{ id: "keep-1", defId: WOODEN_SWORD_DEF_ID }],
    });
    expect(keep.equipped.weapon).toBe("keep-1");
    expect(keep.items).toHaveLength(1);
  });
});
