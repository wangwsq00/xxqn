# M1 立绘资源

第一批国漫立绘，替换战斗 / 洞府 / 灵宠界面中的色块占位。不改玩法数值。

源图为横构图，入库前裁成 **512×512 PNG**，放在 Vite 静态目录 `public/assets/`（构建后位于 `dist/assets/`）。Phaser 在 `Boot` 场景 `preload` 中各加载一次。

## 文件

| 文件 | Phaser 键 | 角色 | 使用处 |
|------|-----------|------|--------|
| `public/assets/player_hero.png` | `player_hero` | 青年男修士主角（青袍红绦） | 战斗我方 1 号中位；洞府左侧头像 |
| `public/assets/pet_linghu.png` | `pet_linghu` | 灵狐（白毛青辉多尾） | 战斗我方 2 号位（已出战）；洞府右侧头像；灵宠出战槽与已有列表 |
| `public/assets/enemy_wild.png` | `enemy_wild` | 野修灵狼 | 试炼第 1 关敌人；试炼选关卡面 |
| `public/assets/enemy_evil.png` | `enemy_evil` | 邪修 | 试炼第 2 关敌人；试炼选关卡面 |
| `public/assets/enemy_demon.png` | `enemy_demon` | 魔修（红肤有角） | 试炼第 3 关敌人；试炼选关卡面 |
| `public/assets/enemy_heart_demon.png` | `enemy_heart_demon` | 心魔（紫黑烟气） | 心魔战敌方 1 号中位 |

## 接入点

- `src/assets/portraits.ts`：键名与路径
- `src/ui/portraitView.ts`：`preloadPortraits` / 方形显示辅助
- `src/scenes/BootScene.ts`：统一加载
- `src/combat/types.ts` 的 `portraitKey`：仅展示，不进伤害与 ATB
- `src/scenes/BattleScene.ts`：槽位色块改为立绘（空位仍为淡色矩形）
- `src/scenes/HubScene.ts`：洞府主角 / 出战灵宠头像
- `src/scenes/PetScene.ts`：出战槽与已有灵宠
- `src/scenes/TrialSelectScene.ts`：三关卡面缩略图

槽位显示边长约 **72–128px**（竖屏 720×1280），源纹理 512²，避免拉伸。
