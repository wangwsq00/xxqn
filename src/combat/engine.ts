import { ATB_MAX } from "./constants";
import { defaultRng, rollHitSegments, type Rng } from "./damage";
import { selectSkill, startCooldown, tickCooldowns } from "./skills";
import { livingOnSide, pickTargets } from "./targeting";
import type {
  ActionResult,
  BattleStatus,
  Combatant,
  TargetResult,
} from "./types";

function compareReady(a: Combatant, b: Combatant): number {
  if (b.stats.spd !== a.stats.spd) {
    return b.stats.spd - a.stats.spd;
  }
  if (a.slot !== b.slot) {
    return a.slot - b.slot;
  }
  if (a.side !== b.side) {
    return a.side === "ally" ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

export class BattleEngine {
  readonly units: Combatant[];
  status: BattleStatus = "ongoing";
  readonly log: string[] = [];
  private readonly rng: Rng;

  constructor(units: Combatant[], rng: Rng = defaultRng) {
    this.units = units;
    this.rng = rng;
  }

  living(): Combatant[] {
    return this.units.filter((unit) => unit.alive);
  }

  tick(): ActionResult | null {
    if (this.status !== "ongoing") {
      return null;
    }

    for (const unit of this.living()) {
      unit.atb = Math.min(ATB_MAX, unit.atb + unit.stats.spd);
    }

    const ready = this.living().filter((unit) => unit.atb >= ATB_MAX);
    if (ready.length === 0) {
      return null;
    }

    ready.sort(compareReady);
    const actor = ready[0];
    actor.atb = 0;
    const result = this.resolveAction(actor);
    this.refreshStatus();
    return result;
  }

  /** 推进直到产生一次行动或战斗结束。 */
  stepUntilAction(maxTicks = 200): ActionResult | null {
    for (let i = 0; i < maxTicks; i += 1) {
      const action = this.tick();
      if (action || this.status !== "ongoing") {
        return action;
      }
    }
    return null;
  }

  private resolveAction(actor: Combatant): ActionResult {
    tickCooldowns(actor);
    const selected = selectSkill(actor);
    startCooldown(selected);
    const targets = pickTargets(actor, this.units, selected.def.pattern, this.rng);
    const targetResults: TargetResult[] = [];

    for (const target of targets) {
      if (!target.alive) {
        continue;
      }
      const segments = rollHitSegments(actor.stats, target.stats, selected.def.hits, this.rng);
      let total = 0;
      for (const segment of segments) {
        if (segment.trigger === "hit" && segment.damage > 0 && target.alive) {
          target.stats.hp = Math.max(0, target.stats.hp - segment.damage);
          total += segment.damage;
          if (target.stats.hp <= 0) {
            target.alive = false;
            target.atb = 0;
          }
        }
      }
      targetResults.push({ targetId: target.id, segments, totalDamage: total });
    }

    const names = targets.map((unit) => unit.name).join("、") || "无人";
    const verb = selected.isBasicAttack ? "普通攻击" : `施展「${selected.def.name}」`;
    this.log.push(`${actor.name} ${verb} → ${names}`);
    if (this.log.length > 40) {
      this.log.shift();
    }

    return {
      actorId: actor.id,
      skillName: selected.def.name,
      isBasicAttack: selected.isBasicAttack,
      targets: targetResults,
    };
  }

  private refreshStatus(): void {
    const allies = livingOnSide(this.units, "ally");
    const enemies = livingOnSide(this.units, "enemy");
    if (enemies.length === 0) {
      this.status = "victory";
      this.log.push("战斗胜利");
    } else if (allies.length === 0) {
      this.status = "defeat";
      this.log.push("战斗失败");
    }
  }
}
