import { makeCombatant, makeHero, realmBaseStat } from "../combat/factory";
import type { Combatant, EquippedSkill } from "../combat/types";
import { EMPTY_GEAR } from "../equip/catalog";
import type { GearBonus } from "../equip/types";
import { getTrialStage } from "../trial/catalog";

export type BattleMode = "trial" | "heartDemon";

/** M1 试炼：主角居中，对位该关敌人。功法由存档槽位传入，未装备则只普攻。 */
export function createTrialEncounter(
  gear: Partial<GearBonus> = EMPTY_GEAR,
  realmMajor = 1,
  skills: EquippedSkill[] = [],
  stageId = 1,
): Combatant[] {
  const hero = makeHero(skills, gear, realmMajor);
  const stage = getTrialStage(stageId);
  const enemies = stage.enemies.map((enemy, index) =>
    makeCombatant({
      id: `enemy-${index + 1}`,
      name: enemy.name,
      side: "enemy",
      slot: enemy.slot,
      stats: {
        hp: enemy.hp,
        maxHp: enemy.hp,
        atk: enemy.atk,
        def: enemy.def,
        spd: enemy.spd,
        hit: enemy.hit,
        dodge: enemy.dodge,
        crit: enemy.crit,
        critResist: enemy.critResist,
        block: enemy.block,
        blockResist: enemy.blockResist,
      },
    }),
  );
  return [hero, ...enemies];
}

/**
 * M1 心魔战：复用试炼 ATB 布局，单名「心魔」占敌方 1 号中位。
 * 数值为工程默认（文档只要求「具备足够战斗力」），按当前大境界基础值缩放，炼气九层可打过。
 */
export function createHeartDemonEncounter(
  gear: Partial<GearBonus> = EMPTY_GEAR,
  realmMajor = 1,
  skills: EquippedSkill[] = [],
): Combatant[] {
  const hero = makeHero(skills, gear, realmMajor);
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
