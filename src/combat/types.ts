export type Side = "ally" | "enemy";

export type SlotIndex = 1 | 2 | 3 | 4 | 5;

export type AttackPattern = "single" | "aoe" | "random3";

export type HitTrigger = "hit" | "miss" | "skip";

export interface SkillHit {
  /** 相对基础伤害的系数，1 = 100%。 */
  coefficient: number;
  /** 0–100，本段触发概率；失败则中断后续段。 */
  triggerChance: number;
}

export type SkillKind = "attack" | "guard";

export interface SkillDef {
  id: string;
  name: string;
  pattern: AttackPattern;
  /** 以「该单位自身行动次数」计的冷却。普攻为 0。 */
  cooldownTurns: number;
  hits: SkillHit[];
  kind?: SkillKind;
  bonusAtk?: number;
  bonusDef?: number;
  bonusCrit?: number;
  shieldRatio?: number;
  shieldDurationTurns?: number;
}

export interface CombatStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  hit: number;
  dodge: number;
  crit: number;
  critResist: number;
  block: number;
  blockResist: number;
}

export interface EquippedSkill {
  def: SkillDef;
  cooldownRemaining: number;
}

export interface Combatant {
  id: string;
  name: string;
  side: Side;
  slot: SlotIndex;
  stats: CombatStats;
  atb: number;
  /** 1–4 号功法槽，按释放优先级排列；空槽省略。 */
  skills: EquippedSkill[];
  silenced: boolean;
  alive: boolean;
  isHero: boolean;
  /** Phaser 纹理键；仅展示，不参与伤害/ATB。 */
  portraitKey?: string;
  shieldHp: number;
  /** 剩余持续：持有者自身行动次数（不含施放当次）。 */
  shieldTurns: number;
}

export interface DamageSegment {
  index: number;
  trigger: HitTrigger;
  crit: boolean;
  blocked: boolean;
  damage: number;
  cumulative: number;
}

export interface TargetResult {
  targetId: string;
  segments: DamageSegment[];
  totalDamage: number;
}

export interface ActionResult {
  actorId: string;
  skillName: string;
  isBasicAttack: boolean;
  targets: TargetResult[];
}

export type BattleStatus = "ongoing" | "victory" | "defeat";
