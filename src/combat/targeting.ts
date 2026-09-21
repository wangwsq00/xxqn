import { SLOT_INDICES } from "./constants";
import type { AttackPattern, Combatant, SlotIndex } from "./types";

export function livingOnSide(units: Combatant[], side: Combatant["side"]): Combatant[] {
  return units.filter((unit) => unit.side === side && unit.alive);
}

export function unitInSlot(
  units: Combatant[],
  side: Combatant["side"],
  slot: SlotIndex,
): Combatant | undefined {
  return units.find((unit) => unit.side === side && unit.slot === slot && unit.alive);
}

/**
 * 主目标：对位优先；对位不可攻击则按 1→5 号寻找第一个存活敌人。
 */
export function pickPrimaryTarget(actor: Combatant, units: Combatant[]): Combatant | undefined {
  const foes = livingOnSide(units, actor.side === "ally" ? "enemy" : "ally");
  if (foes.length === 0) {
    return undefined;
  }
  const opposite = unitInSlot(foes, foes[0].side, actor.slot);
  if (opposite) {
    return opposite;
  }
  for (const slot of SLOT_INDICES) {
    const found = unitInSlot(foes, foes[0].side, slot);
    if (found) {
      return found;
    }
  }
  return foes[0];
}

export function pickTargets(
  actor: Combatant,
  units: Combatant[],
  pattern: AttackPattern,
  rng: () => number = Math.random,
): Combatant[] {
  const primary = pickPrimaryTarget(actor, units);
  if (!primary) {
    return [];
  }
  const foes = livingOnSide(units, primary.side);
  if (pattern === "single") {
    return [primary];
  }
  if (pattern === "aoe") {
    return foes;
  }
  const others = foes.filter((unit) => unit.id !== primary.id);
  const extra: Combatant[] = [];
  const pool = [...others];
  while (extra.length < 2 && pool.length > 0) {
    const index = Math.floor(rng() * pool.length);
    extra.push(pool.splice(index, 1)[0]);
  }
  return [primary, ...extra];
}
