import { makeCombatant, realmBaseStat } from "../combat/factory";
import type { CombatStats, Combatant } from "../combat/types";
import { getPetDef, PET_ALLY_SLOT, STARTER_PET_IDS, type PetDef } from "./catalog";
import type { SavePet } from "./types";

export function starterPets(): SavePet {
  return {
    owned: [...STARTER_PET_IDS],
    equippedId: null,
  };
}

export function ownsPet(pets: SavePet, defId: string): boolean {
  return pets.owned.includes(defId);
}

export function isPetEquipped(pets: SavePet, defId: string): boolean {
  return pets.equippedId === defId;
}

export function unequippedOwned(pets: SavePet): string[] {
  return pets.owned.filter((id) => getPetDef(id) && id !== pets.equippedId);
}

export function equipPet(pets: SavePet, defId: string): SavePet {
  if (!ownsPet(pets, defId) || !getPetDef(defId)) {
    return pets;
  }
  return { owned: [...pets.owned], equippedId: defId };
}

export function unequipPet(pets: SavePet): SavePet {
  return { owned: [...pets.owned], equippedId: null };
}

export function derivePetStats(def: PetDef, realmMajor: number): CombatStats {
  const base = realmBaseStat(realmMajor);
  const hp = Math.round(base * def.hpRatio);
  return {
    hp,
    maxHp: hp,
    atk: Math.round(base * def.atkRatio),
    def: Math.round(base * def.defRatio),
    spd: Math.round(base * def.spdRatio),
    hit: def.hit,
    dodge: def.dodge,
    crit: def.crit,
    critResist: def.critResist,
    block: def.block,
    blockResist: def.blockResist,
  };
}

export function makePetCombatant(def: PetDef, realmMajor = 1): Combatant {
  const slot = def.slot === 1 ? PET_ALLY_SLOT : def.slot;
  return makeCombatant({
    id: `pet-${def.id}`,
    name: def.name,
    side: "ally",
    slot,
    stats: derivePetStats(def, realmMajor),
    skills: [],
    isHero: false,
  });
}

export function equippedPetCombatant(pets: SavePet, realmMajor = 1): Combatant | null {
  if (!pets.equippedId) {
    return null;
  }
  const def = getPetDef(pets.equippedId);
  if (!def) {
    return null;
  }
  return makePetCombatant(def, realmMajor);
}

export function migratePets(raw: unknown): SavePet {
  const starter = starterPets();
  if (!raw || typeof raw !== "object") {
    return starter;
  }
  const parsed = raw as Partial<SavePet>;
  const ownedRaw = Array.isArray(parsed.owned)
    ? parsed.owned.filter((id): id is string => typeof id === "string" && Boolean(getPetDef(id)))
    : [];
  const owned = [...ownedRaw];
  for (const id of STARTER_PET_IDS) {
    if (!owned.includes(id)) {
      owned.push(id);
    }
  }
  const equippedId =
    typeof parsed.equippedId === "string" && owned.includes(parsed.equippedId) && getPetDef(parsed.equippedId)
      ? parsed.equippedId
      : null;
  return { owned, equippedId };
}
