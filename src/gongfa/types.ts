/** 与 `03_功法系统.md` 1–4 号释放槽一致；5 号普攻固定不入库。 */
export const GONGFA_SLOT_COUNT = 4;

export type GongfaSlotIndex = 0 | 1 | 2 | 3;

export type GongfaKind = "attack" | "guard";

export interface SaveGongfa {
  /** 已拥有的功法定义 id（M1 非实例）。 */
  owned: string[];
  /** 1–4 号槽，空槽为 null。 */
  slots: [string | null, string | null, string | null, string | null];
}
