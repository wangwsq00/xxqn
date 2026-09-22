import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { BattleScene } from "../scenes/BattleScene";
import { EquipScene } from "../scenes/EquipScene";
import { GatheringScene } from "../scenes/GatheringScene";
import { GongfaScene } from "../scenes/GongfaScene";
import { HubScene } from "../scenes/HubScene";
import { PetScene } from "../scenes/PetScene";
import { TrialSelectScene } from "../scenes/TrialSelectScene";
import { GAME_HEIGHT, GAME_WIDTH } from "../ui/theme";

export function createGame(parent: string | HTMLElement): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#1A2A3A",
    pixelArt: false,
    antialias: true,
    loader: {
      baseURL: import.meta.env.BASE_URL,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, HubScene, GatheringScene, EquipScene, GongfaScene, PetScene, TrialSelectScene, BattleScene],
  });
  if (import.meta.env.DEV) {
    Object.assign(globalThis, { __xxqn: game });
  }
  return game;
}
