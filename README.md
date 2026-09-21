# 修仙千年

修仙题材挂机手游。玩法设计以 `doc/` 为准；本仓库 M1 提供浏览器可玩脚手架（洞府 + 试炼战斗）。

## 技术栈

Web TypeScript + Vite + Phaser 3。不使用 Godot，不做独立 App。决策记录见 [`doc/10_工程决策.md`](doc/10_工程决策.md)。

## 本地运行

需要 Node.js 18+。在仓库根目录：

```bash
npm install
npm run dev
```

或使用 pnpm：

```bash
pnpm install
pnpm dev
```

终端会打印本地地址，默认 [http://localhost:5173](http://localhost:5173)。用浏览器打开后：

1. 自动进入**洞府**，可见当前境界（默认炼气境一层）、修为进度、修炼速率、待领取灵气/灵石（离线最多按 8 小时结算），以及聚灵阵等级
2. 点击 **领取洞府收益** 入账；灵气达到当前层消耗后 **自动升小境界**（炼气 1–9 层），写入 LocalStorage；刷新后境界仍在
3. 炼气境九层且灵气达 100% 后，点 **挑战心魔**：打一场 ATB 战；胜利进入 **筑基境一层**（灵气清零），失败不扣灵气可再战
4. 点击 **聚灵阵**：消耗灵石布置 / 升级（1–10 级，加成按角色文档），洞府灵气/秒随等级提高
5. 点击 **装备**：六部位槽位（空槽为占位）+ 背包木剑；穿上后攻击按公式提高
6. 点击 **功法**：查看七星剑阵、天罡护体（黄级下品）；点功法装入 1–4 号槽，写入 LocalStorage。未装备则战斗只出普通攻击
7. 点击 **灵宠**：开局已有灵狐（未出战）；点灵宠出战占我方 **2 号位**（主角仍居中），写入 LocalStorage。未出战则试炼只上主角
8. 洞府展示试炼关卡列表与下一解锁关。点击 **进入试炼** 打开三关列表（第1关始终可进）
9. 通关第 N 关解锁第 N+1 关；敌人血攻递增，胜利灵石 50 / 60 / 70。已通最高关写入 LocalStorage
10. 可见双方各 5 个槽位（布局 4-2-1-3-5），**主角固定我方中间 1 号位**，已出战灵宠占 2 号位，对位 1–2 名敌人
11. 行动条自动充能，单位出手（有已装备功法且冷却结束则按 1–4 槽释放，否则普通攻击；灵宠只普攻），战斗会分出胜负
12. **试炼胜利**发放该关灵石（失败无奖励）；返回洞府可见钱包与已通关进度。若尚未拥有木剑，仍会掉入背包

生产构建（本地 `base` 为 `/`，预览 http://localhost:4173 ）：

```bash
npm run build
npm run preview
```

单测：

```bash
npm test
```

## 在线试玩（GitHub Pages）

推送到 `main`（或手动跑 **Deploy GitHub Pages** workflow）后，会构建 `dist/` 并发布到 `gh-pages` 分支。

**项目页**（当前仓库 `wangwsq00/xxqn`）地址：

https://wangwsq00.github.io/xxqn/

首次需要仓库维护者在 GitHub：**Settings → Pages → Build and deployment** 将 Source 设为 **Deploy from a branch**，Branch 选 **gh-pages** / **root**。

Vite `base` 规则（见 `src/deploy/viteBase.ts`）：

| 场景 | `base` | 地址形态 |
|------|--------|----------|
| 本地 dev / `npm run build` | `/` | `http://localhost:5173` |
| GitHub Actions + 项目页仓库 | `/<repo>/` | `https://<user>.github.io/<repo>/` |
| GitHub Actions + 用户/组织页（仓库名 `*.github.io`） | `/` | `https://<user>.github.io/` |
| 手动覆盖 | `VITE_BASE` 或 `BASE_PATH` | 按你填的路径（会补尾斜杠） |

若把本仓库改成用户主页仓库（例如改名为 `wangwsq00.github.io`），不必改代码，CI 会自动用 `/`。

## 设计文档

入口：[doc/00_概要文档.md](doc/00_概要文档.md)。战斗规则见 [doc/modules/05_战斗系统.md](doc/modules/05_战斗系统.md)。
