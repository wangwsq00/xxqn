import { BASIC_ATTACK_COEFFICIENT } from "./constants";
import type { Combatant, EquippedSkill, SkillDef } from "./types";

export const BASIC_ATTACK: SkillDef = {
  id: "basic-attack",
  name: "普通攻击",
  pattern: "single",
  cooldownTurns: 0,
  hits: [{ coefficient: BASIC_ATTACK_COEFFICIENT, triggerChance: 100 }],
};

export interface SelectedSkill {
  def: SkillDef;
  equipped: EquippedSkill | null;
  isBasicAttack: boolean;
}

/**
 * 1–4 号槽按序：已装备、冷却结束、未被禁法 → 释放；否则普攻。
 */
export function selectSkill(actor: Combatant): SelectedSkill {
  if (!actor.silenced) {
    for (const equipped of actor.skills) {
      if (equipped.cooldownRemaining <= 0) {
        return { def: equipped.def, equipped, isBasicAttack: false };
      }
    }
  }
  return { def: BASIC_ATTACK, equipped: null, isBasicAttack: true };
}

export function tickCooldowns(actor: Combatant): void {
  for (const skill of actor.skills) {
    if (skill.cooldownRemaining > 0) {
      skill.cooldownRemaining -= 1;
    }
  }
}

export function startCooldown(selected: SelectedSkill): void {
  if (selected.equipped && selected.def.cooldownTurns > 0) {
    selected.equipped.cooldownRemaining = selected.def.cooldownTurns;
  }
}
