import { describe, expect, it } from "vitest";
import { ATB_MAX, CENTER_SLOT } from "./constants";
import { createTrialEncounter } from "./encounter";
import { BattleEngine } from "./engine";
import { makeCombatant } from "./factory";
import { pickPrimaryTarget } from "./targeting";
import { rollHitSegments } from "./damage";

describe("trial encounter layout", () => {
  it("places the hero in the center ally slot and two enemies opposite", () => {
    const units = createTrialEncounter();
    const hero = units.find((unit) => unit.isHero);
    expect(hero?.side).toBe("ally");
    expect(hero?.slot).toBe(CENTER_SLOT);
    const enemies = units.filter((unit) => unit.side === "enemy");
    expect(enemies).toHaveLength(2);
    expect(enemies.map((unit) => unit.slot).sort()).toEqual([1, 2]);
  });
});

describe("targeting", () => {
  it("prefers the opposite slot then walks 1 to 5", () => {
    const actor = makeCombatant({
      id: "a",
      name: "A",
      side: "ally",
      slot: 2,
      stats: {
        hp: 10,
        maxHp: 10,
        atk: 10,
        def: 0,
        spd: 10,
        hit: 100,
        dodge: 0,
        crit: 0,
        critResist: 0,
        block: 0,
        blockResist: 0,
      },
    });
    const deadOpp = makeCombatant({
      id: "e2",
      name: "E2",
      side: "enemy",
      slot: 2,
      stats: { hp: 0, maxHp: 10, atk: 1, def: 0, spd: 1, hit: 0, dodge: 0, crit: 0, critResist: 0, block: 0, blockResist: 0 },
    });
    deadOpp.alive = false;
    const slot1 = makeCombatant({
      id: "e1",
      name: "E1",
      side: "enemy",
      slot: 1,
      stats: { hp: 10, maxHp: 10, atk: 1, def: 0, spd: 1, hit: 0, dodge: 0, crit: 0, critResist: 0, block: 0, blockResist: 0 },
    });
    expect(pickPrimaryTarget(actor, [actor, deadOpp, slot1])?.id).toBe("e1");
  });
});

describe("damage", () => {
  it("returns zero damage on a guaranteed miss", () => {
    const attacker = {
      hp: 10,
      maxHp: 10,
      atk: 100,
      def: 0,
      spd: 10,
      hit: 0,
      dodge: 0,
      crit: 0,
      critResist: 0,
      block: 0,
      blockResist: 0,
    };
    const defender = { ...attacker, dodge: 100 };
    const segments = rollHitSegments(attacker, defender, [{ coefficient: 1, triggerChance: 100 }], () => 0.99);
    expect(segments[0].trigger).toBe("miss");
    expect(segments[0].damage).toBe(0);
  });
});

describe("ATB battle", () => {
  it("fills ATB, units act, and the trial fight ends", () => {
    const engine = new BattleEngine(createTrialEncounter(), () => 0.01);
    let actions = 0;
    for (let i = 0; i < 4000 && engine.status === "ongoing"; i += 1) {
      const result = engine.tick();
      if (result) {
        actions += 1;
        expect(result.skillName.length).toBeGreaterThan(0);
        const actor = engine.units.find((unit) => unit.id === result.actorId);
        expect(actor?.atb).toBe(0);
      }
    }
    expect(actions).toBeGreaterThan(2);
    expect(engine.status).not.toBe("ongoing");
    const hero = engine.units.find((unit) => unit.isHero);
    expect(hero?.slot).toBe(CENTER_SLOT);
    const readyOverflow = engine.living().every((unit) => unit.atb <= ATB_MAX);
    expect(readyOverflow).toBe(true);
  });
});
