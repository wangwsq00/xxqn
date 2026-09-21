import { makeCombatant, makeHero, realmBaseStat } from "../combat/factory";
import type { Combatant } from "../combat/types";
import { SEVEN_STAR_SWORD } from "../data/skills";
import { EMPTY_GEAR } from "../equip/catalog";
import type { GearBonus } from "../equip/types";

export type BattleMode = "trial" | "heartDemon";

/** M1 试炼：主角居中，对位 2 名敌人（1 号、2 号）。 */
export function createTrialEncounter(
  gear: Partial<GearBonus> = EMPTY_GEAR,
  realmMajor = 1,
): Combatant[] {
  const hero = makeHero([{ def: SEVEN_STAR_SWORD, cooldownRemaining: 0 }], gear, realmMajor);
  const gruntA = makeCombatant({
    id: "enemy-1",
    name: "野修甲",
    side: "enemy",
    slot: 1,
    stats: {
      hp: 180,
      maxHp: 180,
      atk: 95,
      def: 25,
      spd: 42,
      hit: 80,
      dodge: 5,
      crit: 8,
      critResist: 0,
      block: 5,
      blockResist: 0,
    },
  });
  const gruntB = makeCombatant({
    id: "enemy-2",
    name: "野修乙",
    side: "enemy",
    slot: 2,
    stats: {
      hp: 150,
      maxHp: 150,
      atk: 88,
      def: 20,
      spd: 48,
      hit: 78,
      dodge: 8,
      crit: 12,
      critResist: 0,
      block: 0,
      blockResist: 0,
    },
  });
  return [hero, gruntA, gruntB];
}

/**
 * M1 心魔战：复用试炼 ATB 布局，单名「心魔」占敌方 1 号中位。
 * 数值为工程默认（文档只要求「具备足够战斗力」），按当前大境界基础值缩放，炼气九层可打过。
 */
export function createHeartDemonEncounter(
  gear: Partial<GearBonus> = EMPTY_GEAR,
  realmMajor = 1,
): Combatant[] {
  const hero = makeHero([{ def: SEVEN_STAR_SWORD, cooldownRemaining: 0 }], gear, realmMajor);
  const base = realmBaseStat(realmMajor);
  const hp = Math.round(base * 2.0);
  const demon = makeCombatant({
    id: "heart-demon",
    name: "心魔",
    side: "enemy",
    slot: 1,
    stats: {
      hp,
      maxHp: hp,
      atk: Math.round(base * 0.85),
      def: Math.round(base * 0.28),
      spd: Math.round(base * 0.4),
      hit: 82,
      dodge: 6,
      crit: 10,
      critResist: 0,
      block: 8,
      blockResist: 0,
    },
  });
  return [hero, demon];
}
