import type { EquippedSkill, SkillDef } from "../combat/types";
import { GONGFA_DEFS, getGongfaDef, STARTER_GONGFA_IDS } from "./catalog";
import { GONGFA_SLOT_COUNT, type GongfaSlotIndex, type SaveGongfa } from "./types";

export function emptySlots(): SaveGongfa["slots"] {
  return [null, null, null, null];
}

export function starterGongfa(): SaveGongfa {
  return {
    owned: [...STARTER_GONGFA_IDS],
    slots: emptySlots(),
  };
}

export function ownsGongfa(gongfa: SaveGongfa, defId: string): boolean {
  return gongfa.owned.includes(defId);
}

export function equippedSlotOf(gongfa: SaveGongfa, defId: string): GongfaSlotIndex | null {
  const index = gongfa.slots.findIndex((id) => id === defId);
  if (index < 0 || index >= GONGFA_SLOT_COUNT) {
    return null;
  }
  return index as GongfaSlotIndex;
}

export function unequippedOwned(gongfa: SaveGongfa): string[] {
  const worn = new Set(gongfa.slots.filter((id): id is string => Boolean(id)));
  return gongfa.owned.filter((id) => GONGFA_DEFS[id] && !worn.has(id));
}

/** 点功法装到第一个空槽；已装备或无空槽则原样返回。 */
export function equipGongfa(gongfa: SaveGongfa, defId: string): SaveGongfa {
  if (!ownsGongfa(gongfa, defId) || !getGongfaDef(defId)) {
    return gongfa;
  }
  if (equippedSlotOf(gongfa, defId) !== null) {
    return gongfa;
  }
  const empty = gongfa.slots.findIndex((id) => id == null);
  if (empty < 0) {
    return gongfa;
  }
  const slots = [...gongfa.slots] as SaveGongfa["slots"];
  slots[empty] = defId;
  return { owned: [...gongfa.owned], slots };
}

export function unequipGongfaSlot(gongfa: SaveGongfa, slot: GongfaSlotIndex): SaveGongfa {
  const slots = [...gongfa.slots] as SaveGongfa["slots"];
  slots[slot] = null;
  return { owned: [...gongfa.owned], slots };
}

export function combatSkillsFromGongfa(gongfa: SaveGongfa): EquippedSkill[] {
  const skills: EquippedSkill[] = [];
  for (const defId of gongfa.slots) {
    if (!defId) {
      continue;
    }
    const def = getGongfaDef(defId);
    if (!def) {
      continue;
    }
    skills.push({ def: def.skill, cooldownRemaining: 0 });
  }
  return skills;
}

export function gongfaStatBonus(skills: { def: SkillDef }[]): {
  atk: number;
  def: number;
  crit: number;
} {
  let atk = 0;
  let def = 0;
  let crit = 0;
  for (const skill of skills) {
    atk += skill.def.bonusAtk ?? 0;
    def += skill.def.bonusDef ?? 0;
    crit += skill.def.bonusCrit ?? 0;
  }
  return { atk, def, crit };
}

export function grantStarterGongfa(gongfa: SaveGongfa): SaveGongfa {
  const owned = [...gongfa.owned];
  for (const id of STARTER_GONGFA_IDS) {
    if (!owned.includes(id)) {
      owned.push(id);
    }
  }
  return { owned, slots: [...gongfa.slots] as SaveGongfa["slots"] };
}

export function migrateGongfa(raw: unknown): SaveGongfa {
  const starter = starterGongfa();
  if (!raw || typeof raw !== "object") {
    return starter;
  }
  const parsed = raw as Partial<SaveGongfa>;
  const ownedRaw = Array.isArray(parsed.owned)
    ? parsed.owned.filter((id): id is string => typeof id === "string" && Boolean(getGongfaDef(id)))
    : [];
  const owned = [...ownedRaw];
  for (const id of STARTER_GONGFA_IDS) {
    if (!owned.includes(id)) {
      owned.push(id);
    }
  }
  const seen = new Set<string>();
  const slots = emptySlots();
  const rawSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
  for (let i = 0; i < GONGFA_SLOT_COUNT; i += 1) {
    const id = rawSlots[i];
    if (typeof id !== "string" || !owned.includes(id) || seen.has(id)) {
      slots[i] = null;
      continue;
    }
    seen.add(id);
    slots[i] = id;
  }
  return { owned, slots };
}
