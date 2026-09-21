/** 离线收益封顶：超出部分丢弃。见 `doc/ADDENDUM-from-PM-chat.md` 2.3。 */
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

/**
 * 各大境界基础灵气/秒。
 * 权威口径：`doc/modules/01_角色系统.md`（炼气 1、筑基 2 … 渡劫 256）。
 */
export const QI_PER_SECOND_BY_MAJOR = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

/** 聚灵阵每级灵气加成。1 级 = +10%。未购买为 0 级。 */
export const GATHERING_ARRAY_BONUS_PER_LEVEL = 0.1;

/** 聚灵阵最高等级。权威口径：`01_角色系统.md`。 */
export const MAX_GATHERING_LEVEL = 10;

/**
 * 升到该级所需灵石。下标 0 = 布置 1 级。
 * 权威口径：`01_角色系统.md` 聚灵阵价格表。
 */
export const GATHERING_LEVEL_COSTS = [
  100, 500, 2_000, 8_000, 30_000, 100_000, 300_000, 800_000, 2_000_000, 5_000_000,
] as const;

/**
 * 开局灵石仓库未写。M1 **工程默认**：新档赠送 600，刚好可买 1 级并升到 2 级，
 * 用于验证购买/升级闭环；2 级以上仍按上表。不是聊天稿数值。
 */
export const STARTER_STONES = 600;

/**
 * M1 洞府闲修灵石产出（工程默认）。
 *
 * `07_经济系统.md` / `02_挂机系统.md` 只写「挂机产出资源」，未给小时公式。
 * **不采用**聊天稿 `50+N×18`（依赖不存在的关号 N）。
 * 炼气境 1 灵石/分钟，各大境界倍率与灵气基础倍率相同。
 */
export const STONES_PER_MINUTE_LIANQI = 1;
