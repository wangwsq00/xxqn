import {
  BLOCK_MULTIPLIER,
  CRIT_MULTIPLIER,
  MIN_HIT_CHANCE,
} from "./constants";
import type { CombatStats, DamageSegment, SkillHit } from "./types";

export type Rng = () => number;

export function defaultRng(): number {
  return Math.random();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function rollChance(chance: number, rng: Rng): boolean {
  return rng() * 100 < chance;
}

export function hitChance(attacker: CombatStats, defender: CombatStats): number {
  return clamp(attacker.hit - defender.dodge, MIN_HIT_CHANCE, 100);
}

export function critChance(attacker: CombatStats, defender: CombatStats): number {
  return clamp(attacker.crit - defender.critResist, 0, 100);
}

export function blockChance(attacker: CombatStats, defender: CombatStats): number {
  return clamp(defender.block - attacker.blockResist, 0, 100);
}

export function baseDamage(attacker: CombatStats, defender: CombatStats): number {
  return Math.max(attacker.atk - defender.def, 1);
}

/**
 * 按 `05_战斗系统.md`：命中 → 暴击 → 格挡 → max(攻-防,1)×段系数。
 * 未命中或未触发的段伤害为 0；触发失败会中断后续段。
 */
export function rollHitSegments(
  attacker: CombatStats,
  defender: CombatStats,
  hits: SkillHit[],
  rng: Rng = defaultRng,
): DamageSegment[] {
  const results: DamageSegment[] = [];
  let cumulative = 0;
  let chainAlive = true;
  const base = baseDamage(attacker, defender);
  const pHit = hitChance(attacker, defender);
  const pCrit = critChance(attacker, defender);
  const pBlock = blockChance(attacker, defender);

  for (let i = 0; i < hits.length; i += 1) {
    const hit = hits[i];
    const segment: DamageSegment = {
      index: i + 1,
      trigger: "skip",
      crit: false,
      blocked: false,
      damage: 0,
      cumulative,
    };

    if (!chainAlive) {
      results.push(segment);
      continue;
    }

    if (hit.triggerChance < 100 && !rollChance(hit.triggerChance, rng)) {
      results.push(segment);
      chainAlive = false;
      continue;
    }

    if (!rollChance(pHit, rng)) {
      segment.trigger = "miss";
      results.push(segment);
      continue;
    }

    const crit = rollChance(pCrit, rng);
    const blocked = rollChance(pBlock, rng);
    const critMul = crit ? CRIT_MULTIPLIER : 1;
    const blockMul = blocked ? BLOCK_MULTIPLIER : 1;
    const damage = Math.max(1, Math.round(base * hit.coefficient * critMul * blockMul));

    cumulative += damage;
    segment.trigger = "hit";
    segment.crit = crit;
    segment.blocked = blocked;
    segment.damage = damage;
    segment.cumulative = cumulative;
    results.push(segment);
  }

  return results;
}
