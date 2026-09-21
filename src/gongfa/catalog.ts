import type { SkillDef } from "../combat/types";
import type { GongfaKind } from "./types";

export const QIXING_JIANZHEN_ID = "qixing-jianzhen";
export const TIANGANG_HUTI_ID = "tiangang-huti";

export const STARTER_GONGFA_IDS = [QIXING_JIANZHEN_ID, TIANGANG_HUTI_ID] as const;

export const GONGFA_SLOT_LABELS = ["1号槽（优先）", "2号槽", "3号槽", "4号槽"] as const;

export interface GongfaDef {
  id: string;
  name: string;
  kind: GongfaKind;
  gradeLabel: string;
  summary: string;
  skill: SkillDef;
}

/**
 * 文档示例功法，黄级下品。
 * 七星剑阵冷却文档未写，M1 工程默认 3 次自身行动（见 `doc/10_工程决策.md`）。
 * 天罡护体冷却 / 护盾比例 / 持续按文档：5 回合、20%、3 回合。
 */
export const GONGFA_DEFS: Record<string, GongfaDef> = {
  [QIXING_JIANZHEN_ID]: {
    id: QIXING_JIANZHEN_ID,
    name: "七星剑阵",
    kind: "attack",
    gradeLabel: "黄级下品",
    summary: "单体多段剑气。装备后攻击 +50、暴击 +10%。",
    skill: {
      id: QIXING_JIANZHEN_ID,
      name: "七星剑阵",
      kind: "attack",
      pattern: "single",
      cooldownTurns: 3,
      bonusAtk: 50,
      bonusCrit: 10,
      hits: [
        { coefficient: 0.3, triggerChance: 100 },
        { coefficient: 0.4, triggerChance: 100 },
        { coefficient: 0.5, triggerChance: 70 },
        { coefficient: 0.6, triggerChance: 70 },
        { coefficient: 0.7, triggerChance: 70 },
        { coefficient: 0.8, triggerChance: 70 },
        { coefficient: 1.0, triggerChance: 70 },
      ],
    },
  },
  [TIANGANG_HUTI_ID]: {
    id: TIANGANG_HUTI_ID,
    name: "天罡护体",
    kind: "guard",
    gradeLabel: "黄级下品",
    summary: "自我护盾（生命 20%，3 次行动）。装备后防御 +100。",
    skill: {
      id: TIANGANG_HUTI_ID,
      name: "天罡护体",
      kind: "guard",
      pattern: "single",
      cooldownTurns: 5,
      bonusDef: 100,
      shieldRatio: 0.2,
      shieldDurationTurns: 3,
      hits: [],
    },
  },
};

export const SEVEN_STAR_SWORD: SkillDef = GONGFA_DEFS[QIXING_JIANZHEN_ID].skill;
export const HEAVENLY_GUARD: SkillDef = GONGFA_DEFS[TIANGANG_HUTI_ID].skill;

export function getGongfaDef(defId: string): GongfaDef | undefined {
  return GONGFA_DEFS[defId];
}
