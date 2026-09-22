/** M1 视觉重建调色。界面只使用这一组颜色。 */
export const PALETTE = {
  ink: 0x1a2a3a,
  inkDeep: 0x2e4050,
  parchment: 0xf3e6c8,
  cinnabar: 0xc23b22,
  gold: 0xc9a227,
  cyan: 0x3aa8a0,
  stroke: 0x0e1620,
  body: 0xfff8ee,
} as const;

export const INK_HEX = "#1A2A3A";
export const PARCHMENT_HEX = "#F3E6C8";
export const CINNABAR_HEX = "#C23B22";
export const GOLD_HEX = "#C9A227";
export const CYAN_HEX = "#3AA8A0";
export const STROKE_HEX = "#0E1620";
export const BODY_HEX = "#FFF8EE";

export const COLORS = {
  bg: PALETTE.ink,
  panel: PALETTE.inkDeep,
  panelStroke: PALETTE.gold,
  ally: PALETTE.cyan,
  hero: PALETTE.gold,
  enemy: PALETTE.cinnabar,
  empty: PALETTE.stroke,
  hp: PALETTE.cinnabar,
  hpBg: PALETTE.stroke,
  atb: PALETTE.gold,
  atbBg: PALETTE.ink,
  text: BODY_HEX,
  muted: PARCHMENT_HEX,
  log: PARCHMENT_HEX,
  win: CYAN_HEX,
  lose: CINNABAR_HEX,
  heroHex: GOLD_HEX,
  body: BODY_HEX,
  parchment: PARCHMENT_HEX,
  cinnabarHex: CINNABAR_HEX,
  strokeHex: STROKE_HEX,
  cyanHex: CYAN_HEX,
} as const;

export const FONT = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", system-ui, sans-serif';

export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

/** 底栏高度与点击热区。热区不小于 96。 */
export const DOCK_HEIGHT = 152;
export const DOCK_HIT_HEIGHT = 120;

/** 无 ui_panel / ui_btn 切图时，Phaser 控件对齐的九宫规格。 */
export const UI_PANEL_SIZE = 256;
export const UI_PANEL_SLICE = 32;
export const UI_BTN_WIDTH = 128;
export const UI_BTN_PAD_X = 24;
export const UI_BTN_PAD_Y = 20;
