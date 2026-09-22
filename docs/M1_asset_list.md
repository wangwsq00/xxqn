# M1 立绘与界面资源

洞府法阵、底栏图标、战斗无框站位和共用速度条见 [`M2_presentation.md`](M2_presentation.md)。官方资源路径见 [`M1_presentation_v2.md`](M1_presentation_v2.md) §3.4。下文仍是 M1 立绘与背景。

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

底栏图标、聚灵阵、技能特效和速度条头像已入仓，见文末「官方表现切图」。九宫面板和按钮仍未入库。没有文件时用 Phaser 圆角矩形，规格对齐：

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
- `src/assets/presentation.ts`：`preloadPresentation`，官方 png 在 `public/` 时按 §3.4 逻辑 id 加载

## 官方表现切图（已入仓，2026-09-22）

不改玩法数值，不重出人物全身立绘。权威对照见 [`M1_presentation_v2.md`](M1_presentation_v2.md) §3.4。`Boot.preload` 已能加载下表逻辑 id；选中态 `_selected` 与 `_on` 都在，内容相同，引擎键用 `_on`。

| 文件 | 尺寸 | Phaser 键 | 说明 |
|------|------|-----------|------|
| `public/assets/ui/icons/icon_tab_dongfu.png` | 128 | `icon_tab_dongfu` | 底栏「洞府」默认；另有 `icon_tab_dongfu_256.png` |
| `public/assets/ui/icons/icon_tab_dongfu_selected.png` | 128 | — | 规格选中态；另有 `_256` |
| `public/assets/ui/icons/icon_tab_dongfu_on.png` | 128 | `icon_tab_dongfu_on` | 与 `_selected` 同图；Boot 加载此键；另有 `_256` |
| `public/assets/ui/icons/icon_tab_trial.png` | 128 | `icon_tab_trial` | 底栏「试炼」默认；另有 `_256` |
| `public/assets/ui/icons/icon_tab_trial_selected.png` | 128 | — | 规格选中态；另有 `_256` |
| `public/assets/ui/icons/icon_tab_trial_on.png` | 128 | `icon_tab_trial_on` | 与 `_selected` 同图；另有 `_256` |
| `public/assets/ui/icons/icon_tab_cultivate.png` | 128 | `icon_tab_cultivate` | 底栏「养成」默认；另有 `_256` |
| `public/assets/ui/icons/icon_tab_cultivate_selected.png` | 128 | — | 规格选中态；另有 `_256` |
| `public/assets/ui/icons/icon_tab_cultivate_on.png` | 128 | `icon_tab_cultivate_on` | 与 `_selected` 同图；另有 `_256` |
| `public/assets/fx/array/fx_array_low.png` | 512 | `fx_array_low` | 聚灵阵低档 |
| `public/assets/fx/array/fx_array_mid.png` | 512 | `fx_array_mid` | 聚灵阵中档 |
| `public/assets/fx/array/fx_array_high.png` | 512 | `fx_array_high` | 聚灵阵高档 |
| `public/assets/fx/skill/fx_skill_swordqi.png` | 512 | `fx_skill_swordqi` | 七星剑阵 |
| `public/assets/fx/skill/fx_skill_fireball.png` | 512 | `fx_skill_fireball` | 火球 |
| `public/assets/fx/skill/fx_skill_shockwave.png` | 512 | `fx_skill_shockwave` | 天罡护体 |
| `public/assets/ui/avatar/avatar_mini_player_hero.png` | 96 | — | 美术文件名 |
| `public/assets/ui/avatar/avatar_player_hero.png` | 96 | `avatar_player_hero` | 与 mini 同图；Boot 加载此路径 |
| `public/assets/ui/avatar/avatar_mini_pet_linghu.png` | 96 | — | 美术文件名 |
| `public/assets/ui/avatar/avatar_pet_linghu.png` | 96 | `avatar_pet_linghu` | 与 mini 同图 |
| `public/assets/ui/avatar/avatar_mini_enemy_wild.png` | 96 | — | 美术文件名 |
| `public/assets/ui/avatar/avatar_enemy_wild.png` | 96 | `avatar_enemy_wild` | 与 mini 同图 |
| `public/assets/ui/avatar/avatar_mini_enemy_evil.png` | 96 | — | 美术文件名 |
| `public/assets/ui/avatar/avatar_enemy_evil.png` | 96 | `avatar_enemy_evil` | 与 mini 同图 |
| `public/assets/ui/avatar/avatar_mini_enemy_demon.png` | 96 | — | 美术文件名 |
| `public/assets/ui/avatar/avatar_enemy_demon.png` | 96 | `avatar_enemy_demon` | 与 mini 同图 |
| `public/assets/ui/avatar/avatar_mini_enemy_heart_demon.png` | 96 | — | 美术文件名 |
| `public/assets/ui/avatar/avatar_enemy_heart_demon.png` | 96 | `avatar_enemy_heart_demon` | 与 mini 同图 |

旧图标 `icon_dongfu.png` / `icon_trial.png` / `icon_growth.png` 和 `array_tier1.png`–`array_tier3.png` 仍留在仓库，只在官方文件缺失时回退。
