import type { SaveGongfa } from "../gongfa/types";
import type { SaveEquipment } from "../equip/types";
import type { SaveTrial } from "../trial/types";

export type { SaveEquipment } from "../equip/types";
export type { SaveGongfa } from "../gongfa/types";
export type { SaveTrial } from "../trial/types";

export interface SavePlayer {
  realmMajor: number;
  realmLayer: number;
  lingqi: number;
  stones: number;
  /** 0 = 未购买；1–10 见角色文档聚灵阵表。 */
  gatheringArrayLevel: number;
}

export interface SaveIdle {
  /** 已计入待领取的时间游标（毫秒）。 */
  lastSettleAt: number;
  pendingLingqi: number;
  pendingStones: number;
  /** 最近一次 accrue 看到的间隔（秒），供洞府展示离线时长。 */
  lastOfflineSeconds: number;
}

export interface SaveData {
  version: 1;
  savedAt: number;
  player: SavePlayer;
  idle: SaveIdle;
  equipment: SaveEquipment;
  gongfa: SaveGongfa;
  trial: SaveTrial;
}
