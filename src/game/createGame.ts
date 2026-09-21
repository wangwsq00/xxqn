import Phaser from "phaser";
import { BootScene } from "../scenes/BootScene";
import { BattleScene } from "../scenes/BattleScene";
import { HubScene } from "../scenes/HubScene";
import { GAME_HEIGHT, GAME_WIDTH } from "../ui/theme";

export function createGame(parent: string | HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: "#0d0c14",
    pixelArt: false,
    antialias: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, HubScene, BattleScene],
  });
}
