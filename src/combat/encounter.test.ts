import { describe, expect, it } from "vitest";
import { CENTER_SLOT } from "./constants";
import { createHeartDemonEncounter, createTrialEncounter } from "./encounter";
import { WOODEN_SWORD_ATK } from "../equip/catalog";
import { SEVEN_STAR_SWORD } from "../gongfa/catalog";
import { STARTER_PET_ID } from "../pet/catalog";
import { equipPet, equippedPetCombatant, starterPets } from "../pet/state";

describe("createHeartDemonEncounter", () => {
  it("places the hero in the center slot opposite a single 心魔", () => {
    const units = createHeartDemonEncounter();
    const hero = units.find((unit) => unit.isHero);
    const enemies = units.filter((unit) => unit.side === "enemy");
    expect(hero?.slot).toBe(CENTER_SLOT);
    expect(enemies).toHaveLength(1);
    expect(enemies[0]?.name).toBe("心魔");
    expect(enemies[0]?.slot).toBe(1);
    expect(enemies[0]?.portraitKey).toBe("enemy_heart_demon");
    expect(hero?.portraitKey).toBe("player_hero");
    expect(hero?.stats.atk).toBe(100);
    expect(enemies[0]?.stats.hp).toBe(200);
  });

  it("scales hero and 心魔 with 筑基 base stats and wooden sword", () => {
    const units = createHeartDemonEncounter({ atk: WOODEN_SWORD_ATK }, 2);
    const hero = units.find((unit) => unit.isHero);
    const demon = units.find((unit) => unit.id === "heart-demon");
    expect(hero?.stats.atk).toBe(150 + WOODEN_SWORD_ATK);
    expect(demon?.stats.hp).toBe(300);
  });
});

describe("createTrialEncounter realm stats", () => {
  it("keeps 炼气 hero atk 100 and raises 筑基 to 150", () => {
    expect(createTrialEncounter().find((unit) => unit.isHero)?.stats.atk).toBe(100);
    expect(createTrialEncounter({}, 2).find((unit) => unit.isHero)?.stats.atk).toBe(150);
  });

  it("applies 七星剑阵 passive ATK when the skill is equipped", () => {
    const hero = createTrialEncounter({}, 1, [{ def: SEVEN_STAR_SWORD, cooldownRemaining: 0 }]).find(
      (unit) => unit.isHero,
    );
    expect(hero?.stats.atk).toBe(150);
    expect(hero?.skills[0]?.def.name).toBe("七星剑阵");
  });

  it("uses stronger named enemies on later stages", () => {
    const stage1 = createTrialEncounter().filter((unit) => unit.side === "enemy");
    const stage2 = createTrialEncounter({}, 1, [], 2).filter((unit) => unit.side === "enemy");
    const stage3 = createTrialEncounter({}, 1, [], 3).filter((unit) => unit.side === "enemy");
    expect(stage1.map((unit) => unit.name)).toEqual(["野修甲", "野修乙"]);
    expect(stage2.map((unit) => unit.name)).toEqual(["邪修甲", "邪修乙"]);
    expect(stage3.map((unit) => unit.name)).toEqual(["魔修甲", "魔修乙"]);
    expect(stage1.map((unit) => unit.portraitKey)).toEqual(["enemy_wild", "enemy_wild"]);
    expect(stage2.map((unit) => unit.portraitKey)).toEqual(["enemy_evil", "enemy_evil"]);
    expect(stage3.map((unit) => unit.portraitKey)).toEqual(["enemy_demon", "enemy_demon"]);
    expect(stage1[0]?.stats.hp).toBe(180);
    expect(stage2[0]?.stats.hp).toBeGreaterThan(stage1[0]!.stats.hp);
    expect(stage3[0]?.stats.hp).toBeGreaterThan(stage2[0]!.stats.hp);
    expect(stage2[0]?.stats.atk).toBeGreaterThan(stage1[0]!.stats.atk);
    expect(stage3[0]?.stats.atk).toBeGreaterThan(stage2[0]!.stats.atk);
  });
});

describe("createTrialEncounter with pet", () => {
  it("keeps the hero in center and places 灵狐 in ally slot 2", () => {
    const pet = equippedPetCombatant(equipPet(starterPets(), STARTER_PET_ID), 1);
    expect(pet).not.toBeNull();
    const units = createTrialEncounter({}, 1, [], 1, pet ? [pet] : []);
    const hero = units.find((unit) => unit.isHero);
    const fox = units.find((unit) => unit.id === "pet-linghu");
    expect(hero?.slot).toBe(CENTER_SLOT);
    expect(fox?.slot).toBe(2);
    expect(fox?.side).toBe("ally");
    expect(fox?.isHero).toBe(false);
    expect(fox?.portraitKey).toBe("pet_linghu");
    expect(units.filter((unit) => unit.side === "ally")).toHaveLength(2);
  });
});
