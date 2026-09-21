export interface SaveTrial {
  /** 已通最高关号；0 = 尚未通关。第 1 关始终解锁。 */
  highestCleared: number;
}
