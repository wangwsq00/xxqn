/** 行动条满值。文档未给刻度，工程默认 1000；满条后重置为 0。 */
export const ATB_MAX = 1000;

/** 逻辑帧：每秒 10 tick，每 tick ATB += 速度。 */
export const TICKS_PER_SECOND = 10;
export const TICK_MS = 1000 / TICKS_PER_SECOND;

/** 位置从上到下：4 - 2 - 1 - 3 - 5，1 号位居中。 */
export const SLOT_ORDER_TOP_TO_BOTTOM = [4, 2, 1, 3, 5] as const;

export const CENTER_SLOT = 1;

/** 我方槽 X。立绘脚底锚在此列。 */
export const ALLY_SLOT_X = 150;

/**
 * 槽位脚底 Y（立绘 origin 0.5, 1，不是色块中心）。
 * 1 号主角 ≈ (150, 452)；2 号灵宠 ≈ (150, 320)。
 */
export const SLOT_FOOT_Y = {
  4: 188,
  2: 320,
  1: 452,
  3: 584,
  5: 716,
} as const;

export const SLOT_INDICES = [1, 2, 3, 4, 5] as const;

export const CRIT_MULTIPLIER = 1.5;
export const BLOCK_MULTIPLIER = 0.5;
export const MIN_HIT_CHANCE = 30;
export const BASIC_ATTACK_COEFFICIENT = 1;
