import type { SlotIndex } from "../combat/types";

export const TRIAL_STAGE_COUNT = 3;

export interface TrialEnemyTemplate {
  name: string;
  slot: SlotIndex;
  hp: number;
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

export interface TrialStageDef {
  id: number;
  name: string;
  stones: number;
  enemies: TrialEnemyTemplate[];
}

/**
 * M1 三关试炼（工程默认）。
 *
 * `05_战斗系统.md` 未写线性关卡；**不采用**聊天稿约 80 关。
 * 第 1 关沿用既有野修编制，后两关只抬敌人数值与轻量灵石。
 */
export const TRIAL_STAGES: TrialStageDef[] = [
  {
    id: 1,
    name: "野修试炼",
    stones: 50,
    enemies: [
      {
        name: "野修甲",
        slot: 1,
        hp: 180,
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
      {
        name: "野修乙",
        slot: 2,
        hp: 150,
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
    ],
  },
  {
    id: 2,
    name: "邪修试炼",
    stones: 60,
    enemies: [
      {
        name: "邪修甲",
        slot: 1,
        hp: 225,
        atk: 118,
        def: 32,
        spd: 46,
        hit: 82,
        dodge: 6,
        crit: 10,
        critResist: 0,
        block: 6,
        blockResist: 0,
      },
      {
        name: "邪修乙",
        slot: 2,
        hp: 190,
        atk: 110,
        def: 26,
        spd: 52,
        hit: 80,
        dodge: 8,
        crit: 12,
        critResist: 0,
        block: 2,
        blockResist: 0,
      },
    ],
  },
  {
    id: 3,
    name: "魔修试炼",
    stones: 70,
    enemies: [
      {
        name: "魔修甲",
        slot: 1,
        hp: 280,
        atk: 145,
        def: 40,
        spd: 50,
        hit: 84,
        dodge: 7,
        crit: 12,
        critResist: 0,
        block: 8,
        blockResist: 0,
      },
      {
        name: "魔修乙",
        slot: 2,
        hp: 240,
        atk: 132,
        def: 34,
        spd: 56,
        hit: 82,
        dodge: 9,
        crit: 14,
        critResist: 0,
        block: 4,
        blockResist: 0,
      },
    ],
  },
];

/** 第 1 关灵石，兼容既有单场试炼测试。 */
export const TRIAL_VICTORY_STONES = TRIAL_STAGES[0]?.stones ?? 50;

export function clampTrialStageId(id: number): number {
  if (!Number.isFinite(id)) {
    return 1;
  }
  return Math.min(TRIAL_STAGE_COUNT, Math.max(1, Math.floor(id)));
}

export function getTrialStage(stageId = 1): TrialStageDef {
  const id = clampTrialStageId(stageId);
  return TRIAL_STAGES[id - 1] ?? TRIAL_STAGES[0]!;
}
