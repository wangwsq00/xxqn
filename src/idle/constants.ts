/** 离线收益封顶：超出部分丢弃。见 `doc/ADDENDUM-from-PM-chat.md` 2.3。 */
export const MAX_OFFLINE_SECONDS = 8 * 60 * 60;

/**
 * 各大境界基础灵气/秒。
 * 权威口径：`doc/modules/01_角色系统.md`（炼气 1、筑基 2 … 渡劫 256）。
 */
export const QI_PER_SECOND_BY_MAJOR = [1, 2, 4, 8, 16, 32, 64, 128, 256] as const;

/** 聚灵阵每级灵气加成。1 级 = +10%。未购买为 0 级。 */
export const GATHERING_ARRAY_BONUS_PER_LEVEL = 0.1;

/**
 * M1 洞府闲修灵石产出（工程默认）。
 *
 * `07_经济系统.md` / `02_挂机系统.md` 只写「挂机产出资源」，未给小时公式。
 * **不采用**聊天稿 `50+N×18`（依赖不存在的关号 N）。
 * 炼气境 1 灵石/分钟，各大境界倍率与灵气基础倍率相同。
 */
export const STONES_PER_MINUTE_LIANQI = 1;
