import { CENTER_SLOT } from "./constants";
import type { CombatStats, Combatant, EquippedSkill, SlotIndex } from "./types";

export interface Aptitudes {
  atk: number;
  def: number;
  hp: number;
  spd: number;
}

/** 文档未写初始资质；资质为乘数，P0 默认四维均为 1。 */
export const DEFAULT_APTITUDES: Aptitudes = { atk: 1, def: 1, hp: 1, spd: 1 };

export function realmBaseStat(realmMajor: number): number {
  return 100 + (realmMajor - 1) * 50;
}

/**
 * 按 `01_角色系统.md`：
 * 攻 = 攻资 × (基础+装) × 1.0
 * 防 = 防资 × (基础+装) × 0.8
 * 血 = 血资 × (基础+装) × 3.0
 * 速 = 速资 × (基础+装) × 0.5
 */
export function deriveCombatStats(
  realmMajor: number,
  aptitudes: Aptitudes = DEFAULT_APTITUDES,
  extras?: Partial<Pick<CombatStats, "hit" | "dodge" | "crit" | "critResist" | "block" | "blockResist">>,
): CombatStats {
  const base = realmBaseStat(realmMajor);
  const maxHp = Math.round(aptitudes.hp * base * 3.0);
  const atk = Math.round(aptitudes.atk * base * 1.0);
  const def = Math.round(aptitudes.def * base * 0.8);
  const spd = Math.round(aptitudes.spd * base * 0.5);
  return {
    hp: maxHp,
    maxHp,
    atk,
    def,
    spd,
    hit: extras?.hit ?? 85,
    dodge: extras?.dodge ?? 5,
    crit: extras?.crit ?? 10,
    critResist: extras?.critResist ?? 0,
    block: extras?.block ?? 5,
    blockResist: extras?.blockResist ?? 0,
  };
}

export function makeCombatant(params: {
  id: string;
  name: string;
  side: Combatant["side"];
  slot: SlotIndex;
  stats: CombatStats;
  skills?: EquippedSkill[];
  isHero?: boolean;
}): Combatant {
  return {
    id: params.id,
    name: params.name,
    side: params.side,
    slot: params.slot,
    stats: { ...params.stats, hp: params.stats.hp },
    atb: 0,
    skills: params.skills ?? [],
    silenced: false,
    alive: true,
    isHero: params.isHero ?? false,
  };
}

export function makeHero(skills: EquippedSkill[]): Combatant {
  return makeCombatant({
    id: "hero",
    name: "主角",
    side: "ally",
    slot: CENTER_SLOT,
    stats: deriveCombatStats(1),
    skills,
    isHero: true,
  });
}
