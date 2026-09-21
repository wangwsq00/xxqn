import { createGame } from "./game/createGame";

const parent = document.getElementById("game");
if (!parent) {
  throw new Error("找不到 #game 容器");
}

createGame(parent);
