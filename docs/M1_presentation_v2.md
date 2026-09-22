# 表现层资源规格

只规定怎么显示。不改战斗公式、伤害、挂机产量、存档键、关卡奖励和 Pages 部署。下表官方路径 **已入仓**（2026-09-22）。`Boot.preload` 经 `preloadPresentation` 扫描 `public/` 里的 png：官方文件在就用官方路径，缺文件时才回退旧图标和法阵。

选中态两套文件都在，内容相同：规格名 `icon_tab_*_selected.png`，引擎预加载键 `icon_tab_*_on`（路径 `icon_tab_*_on.png`）。可选 @2x 为同目录 `*_256.png`，底栏仍加载 128 主图，不另挂键。

速度条逻辑 id 是 `avatar_` + 立绘键。美术文件名是 `avatar_mini_*.png`；Boot 认的是同目录 `avatar_*.png`（与 mini 图字节相同），所以 `avatar_*` 能加载。

## 3.4 资源表

| 逻辑 id | 官方路径 | 尺寸 | 用途 | 状态 | 缺图时回退 |
|---------|----------|------|------|------|------------|
| `icon_tab_dongfu` | `public/assets/ui/icons/icon_tab_dongfu.png` | 128（另有 `_256`） | 底栏「洞府」默认 | 已入仓 | `public/assets/ui/icon_dongfu.png` |
| `icon_tab_dongfu_selected` | `public/assets/ui/icons/icon_tab_dongfu_selected.png` | 128（另有 `_256`） | 规格选中态，与 `_on` 同图 | 已入仓 | — |
| `icon_tab_dongfu_on` | `public/assets/ui/icons/icon_tab_dongfu_on.png` | 128（另有 `_256`） | 底栏「洞府」选中，Boot 加载此键 | 已入仓 | 朱砂底 + 赤金圈 |
| `icon_tab_trial` | `public/assets/ui/icons/icon_tab_trial.png` | 128（另有 `_256`） | 底栏「试炼」默认 | 已入仓 | `public/assets/ui/icon_trial.png` |
| `icon_tab_trial_selected` | `public/assets/ui/icons/icon_tab_trial_selected.png` | 128（另有 `_256`） | 规格选中态，与 `_on` 同图 | 已入仓 | — |
| `icon_tab_trial_on` | `public/assets/ui/icons/icon_tab_trial_on.png` | 128（另有 `_256`） | 底栏「试炼」选中，Boot 加载此键 | 已入仓 | 朱砂底 + 赤金圈 |
| `icon_tab_cultivate` | `public/assets/ui/icons/icon_tab_cultivate.png` | 128（另有 `_256`） | 底栏「养成」默认 | 已入仓 | `public/assets/ui/icon_growth.png` |
| `icon_tab_cultivate_selected` | `public/assets/ui/icons/icon_tab_cultivate_selected.png` | 128（另有 `_256`） | 规格选中态，与 `_on` 同图 | 已入仓 | — |
| `icon_tab_cultivate_on` | `public/assets/ui/icons/icon_tab_cultivate_on.png` | 128（另有 `_256`） | 底栏「养成」选中，Boot 加载此键 | 已入仓 | 朱砂底 + 赤金圈 |
| `fx_array_low` | `public/assets/fx/array/fx_array_low.png` | 512 俯视 | 聚灵阵 1–3 级，或炼气–金丹 | 已入仓 | `public/assets/fx/array_tier1.png` |
| `fx_array_mid` | `public/assets/fx/array/fx_array_mid.png` | 512 俯视 | 聚灵阵 4–6 级，或元婴–炼虚 | 已入仓 | `public/assets/fx/array_tier2.png` |
| `fx_array_high` | `public/assets/fx/array/fx_array_high.png` | 512 俯视 | 聚灵阵 7–10 级，或合体–渡劫 | 已入仓 | `public/assets/fx/array_tier3.png` |
| `fx_skill_swordqi` | `public/assets/fx/skill/fx_skill_swordqi.png` | 512 | 七星剑阵 | 已入仓 | 原有光点 |
| `fx_skill_fireball` | `public/assets/fx/skill/fx_skill_fireball.png` | 512 | 名称含「火球」的功法 | 已入仓 | 原有光点 |
| `fx_skill_shockwave` | `public/assets/fx/skill/fx_skill_shockwave.png` | 512 | 天罡护体 | 已入仓 | 只做施法姿态 |
| `avatar_player_hero` | `public/assets/ui/avatar/avatar_player_hero.png` | 96 圆 | 速度条 / 洞府头像 | 已入仓 | 从 `player_hero` 裁脸 |
| `avatar_pet_linghu` | `public/assets/ui/avatar/avatar_pet_linghu.png` | 96 圆 | 速度条 | 已入仓 | 从 `pet_linghu` 裁脸 |
| `avatar_enemy_wild` | `public/assets/ui/avatar/avatar_enemy_wild.png` | 96 圆 | 速度条 | 已入仓 | 从 `enemy_wild` 裁脸 |
| `avatar_enemy_evil` | `public/assets/ui/avatar/avatar_enemy_evil.png` | 96 圆 | 速度条 | 已入仓 | 从 `enemy_evil` 裁脸 |
| `avatar_enemy_demon` | `public/assets/ui/avatar/avatar_enemy_demon.png` | 96 圆 | 速度条 | 已入仓 | 从 `enemy_demon` 裁脸 |
| `avatar_enemy_heart_demon` | `public/assets/ui/avatar/avatar_enemy_heart_demon.png` | 96 圆 | 速度条 | 已入仓 | 从 `enemy_heart_demon` 裁脸 |

美术交付的 mini 头像与上表 Boot 路径成对，内容相同，均已入仓：

| 美术文件 | 与 Boot 路径关系 |
|----------|------------------|
| `public/assets/ui/avatar/avatar_mini_player_hero.png` | 同 `avatar_player_hero.png` |
| `public/assets/ui/avatar/avatar_mini_pet_linghu.png` | 同 `avatar_pet_linghu.png` |
| `public/assets/ui/avatar/avatar_mini_enemy_wild.png` | 同 `avatar_enemy_wild.png` |
| `public/assets/ui/avatar/avatar_mini_enemy_evil.png` | 同 `avatar_enemy_evil.png` |
| `public/assets/ui/avatar/avatar_mini_enemy_demon.png` | 同 `avatar_enemy_demon.png` |
| `public/assets/ui/avatar/avatar_mini_enemy_heart_demon.png` | 同 `avatar_enemy_heart_demon.png` |

`player_hero` 的全身重绘不在这批，当前文件仍是半身方图。洞府打坐若已有 `public/assets/char/hero_meditate.png`，用它坐在阵上；否则软晕边现有半身。战斗站位同样软晕边，锚点 `origin(0.5, 1)`。

## 洞府

- 法阵中心约 `(360, 760)`，主角脚底 `(360, 780)`，阵在人下面。
- 吸收：外圈呼吸 2.4–3.2 秒，内圈相位错开半个周期，粒子往胸口收。可关，不改领取数量。
- 粒子深度低于底栏热区。

## 战斗

- 无立绘框。普攻冲刺 120–180ms，命中闪白 60–80ms。
- 施法条跟现有出手前摇，不新增引擎前摇字段。
- 灵狐与野修、邪修、魔修、心魔：图底贴边且水平重心在正中，脚底锚点可用，不改槽位。

## 速度条

横坐标只读 `Combatant.atb / ATB_MAX`。出手后引擎把 `atb` 设为 0，头像回到起点。速度不拿来当坐标。叠放沿用 `compareReady`。
