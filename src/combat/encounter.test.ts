import { describe, expect, it } from "vitest";
import { CENTER_SLOT } from "./constants";
import { createHeartDemonEncounter, createTrialEncounter } from "./encounter";
import { WOODEN_SWORD_ATK } from "../equip/catalog";
import { SEVEN_STAR_SWORD } from "../gongfa/catalog";

describe("createHeartDemonEncounter", () => {
  it("places the hero in the center slot opposite a single 心魔", () => {
    const units = createHeartDemonEncounter();
    const hero = units.find((unit) => unit.isHero);
    const enemies = units.filter((unit) => unit.side === "enemy");
    expect(hero?.slot).toBe(CENTER_SLOT);
    expect(enemies).toHaveLength(1);
    expect(enemies[0]?.name).toBe("心魔");
    expect(enemies[0]?.slot).toBe(1);
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
});
