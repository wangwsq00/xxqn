import { makeCombatant, makeHero } from "../combat/factory";
import type { Combatant } from "../combat/types";
import { SEVEN_STAR_SWORD } from "../data/skills";

/** M1 试炼：主角居中，对位 2 名敌人（1 号、2 号）。 */
export function createTrialEncounter(): Combatant[] {
  const hero = makeHero([{ def: SEVEN_STAR_SWORD, cooldownRemaining: 0 }]);
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
