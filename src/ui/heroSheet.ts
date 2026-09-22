import { gearBonusFromEquipment } from "../equip/state";
import { combatSkillsFromGongfa } from "../gongfa/state";
import { makeHero } from "../combat/factory";
import type { CombatStats } from "../combat/types";
import type { SaveData } from "../save/types";

/** 详细属性只列战斗存档里已经有的字段，不另造战力或资质。 */
const FIELDS: { key: keyof CombatStats; label: string }[] = [
  { key: "maxHp", label: "生命" },
  { key: "atk", label: "攻击" },
  { key: "def", label: "防御" },
  { key: "spd", label: "速度" },
  { key: "hit", label: "命中" },
  { key: "dodge", label: "闪避" },
  { key: "crit", label: "暴击" },
  { key: "critResist", label: "抗暴击" },
  { key: "block", label: "格挡" },
  { key: "blockResist", label: "抗格挡" },
];

export interface AttributeLine {
  label: string;
  value: string;
}

/** 与开战时 `makeHero` 同一套装备、功法、境界推导。 */
export function heroAttributeLines(save: SaveData): AttributeLine[] {
  const gear = gearBonusFromEquipment(save.equipment);
  const skills = combatSkillsFromGongfa(save.gongfa);
  const hero = makeHero(skills, gear, save.player.realmMajor);
  return FIELDS.map((field) => ({
    label: field.label,
    value: String(hero.stats[field.key]),
  }));
}
