# M1 立绘与界面资源

洞府法阵、底栏图标、战斗无框站位和共用速度条见 [`M2_presentation.md`](M2_presentation.md)。下文仍是 M1 立绘与背景。

第一批国漫立绘，替换战斗 / 洞府 / 灵宠色块。洞府视觉重建见 [`M1_visual_rebuild.md`](M1_visual_rebuild.md)。不改玩法数值。文件名**不要**用 rabbit / wolf。

Phaser 在 `Boot.preload` 各 `load.image` 一次。战斗槽位立绘 **底中锚点**（origin `0.5, 1`），脚踩槽位坐标，不是色块中心。

## 文件

| 文件 | 边长 | Phaser 键 | 角色 |
|------|------|-----------|------|
| `public/assets/char/player_hero.png` | 512 | `player_hero` | 主角 |
| `public/assets/pet/pet_linghu.png` | 512 | `pet_linghu` | 灵狐 |
| `public/assets/enemy/enemy_wild.png` | 256 | `enemy_wild` | 野修 |
| `public/assets/enemy/enemy_evil.png` | 256 | `enemy_evil` | 邪修 |
| `public/assets/enemy/enemy_demon.png` | 256 | `enemy_demon` | 魔修 |
| `public/assets/enemy/enemy_heart_demon.png` | 256 | `enemy_heart_demon` | 心魔 |

背景（竖屏 cover，见视觉重建文档）：

| 文件 | 画面尺寸 | Phaser 键 | 用在 |
|------|----------|-----------|------|
| `public/assets/bg/bg_dongfu.png` | 1280×720 | `bg_dongfu` | 洞府、开场、养成子页 |
| `public/assets/bg/bg_trial.png` | 1280×720 | `bg_trial` | 试炼选关 |
| `public/assets/bg/bg_battle.png` | 1280×720 | `bg_battle` | 战斗场地 |

UI 切图仍未入库。没有文件时用 Phaser 圆角矩形，规格对齐：

| 规格 | 数值 |
|------|------|
| `ui_panel` | 256，九宫边 32 |
| `ui_btn` | 宽 128，左右 24，上下 20 |

洞府半身立绘显示高 420，脚底 `(360, 780)`。打坐莲座全身像另见 M2，脚底相同。灵宠为半身高度的 60%，在右后方。战斗主角高 360，敌人高 220。锚点 `origin(0.5, 1)`。

## 显示名 → spriteKey

| 显示名 | spriteKey | 说明 |
|--------|-----------|------|
| 主角 / hero | `player_hero` | 我方 1 号中位 |
| 灵狐 / pet | `pet_linghu` | 我方 2 号位 |
| 野修 | `enemy_wild` | 第 1 关；**不是** rabbit/wolf 文件名 |
| 邪修 | `enemy_evil` | 第 2 关 |
| 魔修 | `enemy_demon` | 第 3 关 |
| 心魔 | `enemy_heart_demon` | 心魔战敌方 1 号 |

遭遇编制若仍写兔/狼等玩法 id，在 `SPRITE_KEY_BY_LABEL` / `portraitKey` 映射，不要改玩法 id。

## 战斗槽位

布局从上到下 **4-2-1-3-5**。显示高度见视觉重建文档（主角 360、敌人 220）。立绘脚底常量不变：

- 我方 X = 150；敌方 X = 570
- 1 号（主角）≈ `(150, 452)`
- 2 号（灵宠）≈ `(150, 320)`
- 4 / 3 / 5 号脚底 Y = 188 / 584 / 716

## 接入点

- `src/assets/portraits.ts`：路径、键、显示名表
- `src/ui/portraitView.ts`：preload / 底中或居中绘制
- `src/scenes/BootScene.ts`：统一加载
- `src/scenes/BattleScene.ts`：`drawSlot` 底中立绘。M2 起去掉立绘牌，空位只留淡地标，行动条改为共用速度条
- `src/scenes/HubScene.ts` / `PetScene.ts` / `TrialSelectScene.ts`：洞府打坐场景、试炼海报、灵宠头像
- `src/assets/backdrops.ts` / `src/ui/chrome.ts`：背景铺满与面板按钮
- `src/scenes/BootScene.ts`：立绘与三张背景一起加载
