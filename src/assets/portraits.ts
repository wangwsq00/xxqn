/** M1 国漫立绘：文件名与 `public/assets/`、`doc/M1_asset_list.md` 对齐。 */

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
  { key: PORTRAIT.playerHero, path: "assets/player_hero.png" },
  { key: PORTRAIT.petLinghu, path: "assets/pet_linghu.png" },
  { key: PORTRAIT.enemyWild, path: "assets/enemy_wild.png" },
  { key: PORTRAIT.enemyEvil, path: "assets/enemy_evil.png" },
  { key: PORTRAIT.enemyDemon, path: "assets/enemy_demon.png" },
  { key: PORTRAIT.enemyHeartDemon, path: "assets/enemy_heart_demon.png" },
];

export const BATTLE_PORTRAIT_SIZE = 118;
export const HUB_PORTRAIT_SIZE = 96;
export const PET_SLOT_PORTRAIT_SIZE = 128;
export const PET_LIST_PORTRAIT_SIZE = 72;
export const TRIAL_CARD_PORTRAIT_SIZE = 88;
