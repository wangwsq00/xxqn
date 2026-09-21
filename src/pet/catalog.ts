import type { SlotIndex } from "../combat/types";

/** 开局灵宠。文档未给名称表，M1 工程默认。 */
export const STARTER_PET_ID = "linghu";

export const STARTER_PET_IDS = [STARTER_PET_ID] as const;

/** 灵宠占我方非中位槽；主角固定 1 号。取 2 号为第一只。 */
export const PET_ALLY_SLOT: SlotIndex = 2;

export interface PetDef {
  id: string;
  name: string;
  typeLabel: string;
  gradeLabel: string;
  summary: string;
  slot: SlotIndex;
  /** 相对大境界基础值（100/150/…）的系数。文档无表，见工程决策。 */
  hpRatio: number;
  atkRatio: number;
  defRatio: number;
  spdRatio: number;
  hit: number;
  dodge: number;
  crit: number;
  critResist: number;
  block: number;
  blockResist: number;
}

/**
 * `04_灵宠系统.md` 仅骨架（分类/养成/技能待补充）。
 * 下列数值为 M1 工程默认：弱于主角、仅普攻，随大境界基础值缩放。
 */
export const PET_DEFS: Record<string, PetDef> = {
  [STARTER_PET_ID]: {
    id: STARTER_PET_ID,
    name: "灵狐",
    typeLabel: "灵兽",
    gradeLabel: "黄阶幼兽",
    summary: "开局灵宠。出战占我方 2 号位，只使用普通攻击。",
    slot: PET_ALLY_SLOT,
    hpRatio: 1.5,
    atkRatio: 0.55,
    defRatio: 0.32,
    spdRatio: 0.45,
    hit: 80,
    dodge: 5,
    crit: 8,
    critResist: 0,
    block: 0,
    blockResist: 0,
  },
};

export function getPetDef(defId: string): PetDef | undefined {
  return PET_DEFS[defId];
}
