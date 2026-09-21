/** M1 国漫立绘：路径与 `docs/M1_asset_list.md` 对齐。键名不要用 rabbit/wolf。 */

export const PORTRAIT = {
  playerHero: "player_hero",
  petLinghu: "pet_linghu",
  enemyWild: "enemy_wild",
  enemyEvil: "enemy_evil",
  enemyDemon: "enemy_demon",
  enemyHeartDemon: "enemy_heart_demon",
} as const;

export type PortraitKey = (typeof PORTRAIT)[keyof typeof PORTRAIT];

export interface PortraitFile {
  key: PortraitKey;
  path: string;
}

/** Phaser `load.image` 路径；配合 `createGame` 的 `loader.baseURL`（含 Pages 子路径）。 */
export const PORTRAIT_FILES: PortraitFile[] = [
  { key: PORTRAIT.playerHero, path: "assets/char/player_hero.png" },
  { key: PORTRAIT.petLinghu, path: "assets/pet/pet_linghu.png" },
  { key: PORTRAIT.enemyWild, path: "assets/enemy/enemy_wild.png" },
  { key: PORTRAIT.enemyEvil, path: "assets/enemy/enemy_evil.png" },
  { key: PORTRAIT.enemyDemon, path: "assets/enemy/enemy_demon.png" },
  { key: PORTRAIT.enemyHeartDemon, path: "assets/enemy/enemy_heart_demon.png" },
];

/**
 * 显示名 → 纹理键。遭遇编制若仍写兔/狼等玩法 id，用此表挂立绘，不要改文件名。
 * 当前 M1 编制已是野修/邪修/魔修/心魔。
 */
export const SPRITE_KEY_BY_LABEL: Record<string, PortraitKey> = {
  主角: PORTRAIT.playerHero,
  灵狐: PORTRAIT.petLinghu,
  野修: PORTRAIT.enemyWild,
  邪修: PORTRAIT.enemyEvil,
  魔修: PORTRAIT.enemyDemon,
  心魔: PORTRAIT.enemyHeartDemon,
};

export const BATTLE_PORTRAIT_SIZE = 124;
export const HUB_PORTRAIT_SIZE = 96;
export const PET_SLOT_PORTRAIT_SIZE = 128;
export const PET_LIST_PORTRAIT_SIZE = 72;
export const TRIAL_CARD_PORTRAIT_SIZE = 88;
