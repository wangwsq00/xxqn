import type { SkillDef } from "../combat/types";

/** 黄级下品七星剑阵：必定 2 段，后续 70% 可中断。冷却以自身行动次数计。 */
export const SEVEN_STAR_SWORD: SkillDef = {
  id: "qixing-jianzhen",
  name: "七星剑阵",
  pattern: "single",
  cooldownTurns: 3,
  hits: [
    { coefficient: 0.3, triggerChance: 100 },
    { coefficient: 0.4, triggerChance: 100 },
    { coefficient: 0.5, triggerChance: 70 },
    { coefficient: 0.6, triggerChance: 70 },
    { coefficient: 0.7, triggerChance: 70 },
    { coefficient: 0.8, triggerChance: 70 },
    { coefficient: 1.0, triggerChance: 70 },
  ],
};
