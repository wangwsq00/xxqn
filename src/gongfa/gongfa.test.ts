import { describe, expect, it } from "vitest";
import {
  HEAVENLY_GUARD,
  QIXING_JIANZHEN_ID,
  SEVEN_STAR_SWORD,
  TIANGANG_HUTI_ID,
} from "./catalog";
import {
  combatSkillsFromGongfa,
  equipGongfa,
  equippedSlotOf,
  gongfaStatBonus,
  migrateGongfa,
  starterGongfa,
  unequipGongfaSlot,
  unequippedOwned,
} from "./state";

describe("gongfa catalog and slots", () => {
  it("starts with 七星剑阵 and 天罡护体 owned but unequipped", () => {
    const gongfa = starterGongfa();
    expect(gongfa.owned).toEqual([QIXING_JIANZHEN_ID, TIANGANG_HUTI_ID]);
    expect(gongfa.slots).toEqual([null, null, null, null]);
    expect(unequippedOwned(gongfa)).toHaveLength(2);
    expect(combatSkillsFromGongfa(gongfa)).toHaveLength(0);
  });

  it("equips into the first empty slot and can unequip", () => {
    const first = equipGongfa(starterGongfa(), QIXING_JIANZHEN_ID);
    expect(first.slots[0]).toBe(QIXING_JIANZHEN_ID);
    expect(equippedSlotOf(first, QIXING_JIANZHEN_ID)).toBe(0);
    const both = equipGongfa(first, TIANGANG_HUTI_ID);
    expect(both.slots[1]).toBe(TIANGANG_HUTI_ID);
    expect(combatSkillsFromGongfa(both).map((skill) => skill.def.name)).toEqual([
      "七星剑阵",
      "天罡护体",
    ]);
    const cleared = unequipGongfaSlot(both, 0);
    expect(cleared.slots[0]).toBeNull();
    expect(cleared.slots[1]).toBe(TIANGANG_HUTI_ID);
  });

  it("does not duplicate an already equipped skill", () => {
    const equipped = equipGongfa(starterGongfa(), QIXING_JIANZHEN_ID);
    const again = equipGongfa(equipped, QIXING_JIANZHEN_ID);
    expect(again.slots.filter((id) => id === QIXING_JIANZHEN_ID)).toHaveLength(1);
  });

  it("applies 黄级下品 passives when equipped", () => {
    const skills = combatSkillsFromGongfa(
      equipGongfa(equipGongfa(starterGongfa(), QIXING_JIANZHEN_ID), TIANGANG_HUTI_ID),
    );
    expect(gongfaStatBonus(skills)).toEqual({ atk: 50, def: 100, crit: 10 });
    expect(SEVEN_STAR_SWORD.hits).toHaveLength(7);
    expect(HEAVENLY_GUARD.kind).toBe("guard");
    expect(HEAVENLY_GUARD.shieldRatio).toBe(0.2);
  });

  it("migrates missing gongfa onto starter owned skills with empty slots", () => {
    const migrated = migrateGongfa(undefined);
    expect(migrated.owned).toEqual([QIXING_JIANZHEN_ID, TIANGANG_HUTI_ID]);
    expect(migrated.slots).toEqual([null, null, null, null]);
    const keep = migrateGongfa({
      owned: [QIXING_JIANZHEN_ID],
      slots: [QIXING_JIANZHEN_ID, "fan-jian-jue", QIXING_JIANZHEN_ID, null],
    });
    expect(keep.owned).toContain(TIANGANG_HUTI_ID);
    expect(keep.slots[0]).toBe(QIXING_JIANZHEN_ID);
    expect(keep.slots[1]).toBeNull();
    expect(keep.slots[2]).toBeNull();
  });
});
