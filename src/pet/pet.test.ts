import { describe, expect, it } from "vitest";
import { CENTER_SLOT } from "../combat/constants";
import { STARTER_PET_ID, PET_ALLY_SLOT, getPetDef } from "./catalog";
import {
  derivePetStats,
  equipPet,
  equippedPetCombatant,
  isPetEquipped,
  migratePets,
  starterPets,
  unequipPet,
  unequippedOwned,
} from "./state";

describe("pet catalog and equip", () => {
  it("starts with 灵狐 owned but unequipped", () => {
    const pets = starterPets();
    expect(pets.owned).toEqual([STARTER_PET_ID]);
    expect(pets.equippedId).toBeNull();
    expect(unequippedOwned(pets)).toEqual([STARTER_PET_ID]);
    expect(equippedPetCombatant(pets)).toBeNull();
  });

  it("equips into ally slot 2 and never the hero center", () => {
    const equipped = equipPet(starterPets(), STARTER_PET_ID);
    expect(isPetEquipped(equipped, STARTER_PET_ID)).toBe(true);
    const unit = equippedPetCombatant(equipped, 1);
    expect(unit?.name).toBe("灵狐");
    expect(unit?.side).toBe("ally");
    expect(unit?.slot).toBe(PET_ALLY_SLOT);
    expect(unit?.slot).not.toBe(CENTER_SLOT);
    expect(unit?.isHero).toBe(false);
    expect(unit?.portraitKey).toBe("pet_linghu");
    expect(unit?.skills).toEqual([]);
    const cleared = unequipPet(equipped);
    expect(cleared.equippedId).toBeNull();
    expect(equippedPetCombatant(cleared)).toBeNull();
  });

  it("uses M1 default stats that scale with 大境界", () => {
    const def = getPetDef(STARTER_PET_ID)!;
    const qi = derivePetStats(def, 1);
    expect(qi).toMatchObject({ hp: 150, maxHp: 150, atk: 55, def: 32, spd: 45 });
    const foundation = derivePetStats(def, 2);
    expect(foundation.hp).toBe(225);
    expect(foundation.atk).toBe(83);
    expect(foundation.spd).toBe(68);
  });

  it("migrates missing pets onto starter 灵狐 unequipped", () => {
    const migrated = migratePets(undefined);
    expect(migrated.owned).toEqual([STARTER_PET_ID]);
    expect(migrated.equippedId).toBeNull();
    const keep = migratePets({
      owned: [STARTER_PET_ID],
      equippedId: STARTER_PET_ID,
    });
    expect(keep.equippedId).toBe(STARTER_PET_ID);
    const dropUnknown = migratePets({
      owned: ["fan-beast"],
      equippedId: "fan-beast",
    });
    expect(dropUnknown.owned).toEqual([STARTER_PET_ID]);
    expect(dropUnknown.equippedId).toBeNull();
  });

  it("ignores equip of unknown or unowned ids", () => {
    expect(equipPet(starterPets(), "no-such-pet").equippedId).toBeNull();
  });
});
