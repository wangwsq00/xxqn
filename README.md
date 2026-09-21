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

1. 自动进入**洞府**
2. 点击 **进入试炼**
3. 可见双方各 5 个槽位（布局 4-2-1-3-5），**主角固定我方中间 1 号位**，对位 1–2 名敌人
4. 行动条自动充能，单位出手（有功法则按 1–4 槽释放，否则普通攻击），战斗会分出胜负

生产构建：

```bash
npm run build
npm run preview
```

战斗逻辑单测：

```bash
npm test
```

## 设计文档

入口：[doc/00_概要文档.md](doc/00_概要文档.md)。战斗规则见 [doc/modules/05_战斗系统.md](doc/modules/05_战斗系统.md)。
