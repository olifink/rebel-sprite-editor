/**
 * Sprite Bank & Editor Data Models
 * Specifications according to SPRITE-BANK.md
 */

export interface PaletteColor {
  index: number;
  r: number;
  g: number;
  b: number;
  hex: string;
  u32: number; // 0x00RRGGBB
  isTransparent: boolean; // index === 0 is transparent / color-key
}

export interface SpriteEntry {
  id: number;
  name: string;
  width: number; // Multiple of 8 (8, 16, 24, 32, 48, 64, etc.)
  height: number; // Multiple of 8 (8, 16, 24, 32, 48, 64, etc.)
  hFlip: boolean; // bit 0 of attribute flags
  vFlip: boolean; // bit 1 of attribute flags
  pixelData: Uint8Array; // 4bpp nibbles, size = (width / 2) * height
  modified: boolean;
  isEmpty: boolean;
}

export type DrawTool =
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'picker'
  | 'line'
  | 'rect'
  | 'rect-fill'
  | 'circle'
  | 'circle-fill'
  | 'fill'
  | 'select';

export interface PalettePreset {
  id: string;
  name: string;
  description: string;
  colors: string[]; // 16 hex color strings (#RRGGBB)
}

export interface SpriteBankPreset {
  id: string;
  name: string;
  description: string;
  paletteId: string;
  entries: {
    name: string;
    width: number;
    height: number;
    hFlip?: boolean;
    vFlip?: boolean;
    pixelHex: string; // Hex string representing 4bpp bytes
  }[];
}

export const PALETTE_ENTRIES = 16;
export const PALETTE_SIZE_BYTES = 64; // 16 * 4 bytes (32-bit 0xRRGGBB each)
export const ENTRY_HEADER_SIZE = 4; // width (1), height (1), flags (1), reserved (1)
export const TAG_HEADER_MAGIC = [0x52, 0x41, 0x53, 0x50, 0x52, 0x54]; // 'R','A','S','P','R','T'

/** Built-in 16-color palette presets */
export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'zxspectrum',
    name: 'ZX Spectrum 16-Color',
    description: 'Authentic 16-color palette (8 normal + 8 bright) from the Sinclair ZX Spectrum.',
    colors: [
      '#000000', // 0: Black (Transparent)
      '#0000d7', // 1: Blue
      '#d70000', // 2: Red
      '#d700d7', // 3: Magenta
      '#00d700', // 4: Green
      '#00d7d7', // 5: Cyan
      '#d7d700', // 6: Yellow
      '#d7d7d7', // 7: White
      '#000000', // 8: Bright Black
      '#0000ff', // 9: Bright Blue
      '#ff0000', // 10: Bright Red
      '#ff00ff', // 11: Bright Magenta
      '#00ff00', // 12: Bright Green
      '#00ffff', // 13: Bright Cyan
      '#ffff00', // 14: Bright Yellow
      '#ffffff'  // 15: Bright White
    ]
  },
  {
    id: 'pico8',
    name: 'PICO-8 Fantasy Console',
    description: '16 carefully curated colors from the iconic PICO-8 fantasy console.',
    colors: [
      '#000000', // 0: Black
      '#1d2b53', // 1: Dark Blue
      '#7e2553', // 2: Dark Purple
      '#008751', // 3: Dark Green
      '#ab5236', // 4: Brown
      '#5f574f', // 5: Dark Gray
      '#c2c3c7', // 6: Light Gray
      '#fff1e8', // 7: White
      '#ff004d', // 8: Red
      '#ffa300', // 9: Orange
      '#ffec27', // 10: Yellow
      '#00e436', // 11: Green
      '#29adff', // 12: Cyan / Light Blue
      '#83769c', // 13: Indigo
      '#ff77a8', // 14: Pink
      '#ffccaa'  // 15: Peach
    ]
  },
  {
    id: 'sweetie16',
    name: 'Sweetie 16',
    description: 'A vibrant and versatile 16-color palette designed for pixel art and retro games.',
    colors: [
      '#1a1c2c', // 0: Dark Navy (Transparent)
      '#5d275d', // 1: Plum
      '#b13e53', // 2: Crimson
      '#ef7d57', // 3: Tangerine
      '#ffcd75', // 4: Yellow
      '#a7f070', // 5: Lime
      '#38b764', // 6: Green
      '#257179', // 7: Teal
      '#29366f', // 8: Navy
      '#3b5dc9', // 9: Blue
      '#41a6f6', // 10: Sky Blue
      '#73eff7', // 11: Light Cyan
      '#f4f4f4', // 12: White
      '#94b0c2', // 13: Silver
      '#566c86', // 14: Slate
      '#333c57'  // 15: Charcoal
    ]
  },
  {
    id: 'db16',
    name: 'DawnBringer 16 (DB16)',
    description: 'Legendary 16-color master palette by DawnBringer with rich ramps.',
    colors: [
      '#140c1c', // 0
      '#442434', // 1
      '#30346d', // 2
      '#4e4a4e', // 3
      '#854c30', // 4
      '#346524', // 5
      '#d04648', // 6
      '#757161', // 7
      '#597dce', // 8
      '#d27d2c', // 9
      '#8595a1', // 10
      '#6daa2c', // 11
      '#d2aa99', // 12
      '#6dc2ca', // 13
      '#dad45e', // 14
      '#deeed6'  // 15
    ]
  },
  {
    id: 'c64',
    name: 'Commodore 64',
    description: 'The classic 16-color palette of the Commodore 64 home computer.',
    colors: [
      '#000000', // 0: Black
      '#ffffff', // 1: White
      '#880000', // 2: Red
      '#aaffee', // 3: Cyan
      '#cc44cc', // 4: Purple
      '#00cc55', // 5: Green
      '#0000aa', // 6: Blue
      '#eeee77', // 7: Yellow
      '#dd8855', // 8: Orange
      '#664400', // 9: Brown
      '#ff7777', // 10: Light Red
      '#333333', // 11: Dark Gray
      '#777777', // 12: Medium Gray
      '#aaff66', // 13: Light Green
      '#0088ff', // 14: Light Blue
      '#bbbbbb'  // 15: Light Gray
    ]
  },
  {
    id: 'gameboy',
    name: 'Game Boy 16-Shade Green',
    description: 'Extended monochrome olive green shades from classic 1989 handheld gaming.',
    colors: [
      '#081808', '#0f380f', '#184818', '#205820',
      '#286828', '#307830', '#388838', '#409840',
      '#50a850', '#60b860', '#70c870', '#80d880',
      '#8bac0f', '#9bbc0f', '#b0d030', '#cadc9f'
    ]
  },
  {
    id: 'cga',
    name: 'IBM CGA 16-Color',
    description: 'Standard 16-color RGBI palette from IBM Color Graphics Adapter.',
    colors: [
      '#000000', '#0000aa', '#00aa00', '#00aaaa',
      '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa',
      '#555555', '#5555ff', '#55ff55', '#55ffff',
      '#ff5555', '#ff55ff', '#ffff55', '#ffffff'
    ]
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon 16',
    description: 'High-contrast glowing neon synthwave palette for futuristic arcade games.',
    colors: [
      '#050510', '#101030', '#2a0845', '#64127a',
      '#a3158c', '#ff007f', '#ff5493', '#ff8cc0',
      '#00f0ff', '#00c3ff', '#0084ff', '#003cff',
      '#39ff14', '#ffe600', '#ff9900', '#ffffff'
    ]
  }
];

/** Utility to convert hex color (#RRGGBB) to PaletteColor object */
export function hexToPaletteColor(hex: string, index: number): PaletteColor {
  const cleanHex = hex.replace('#', '').padEnd(6, '0');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const u32 = (r << 16) | (g << 8) | b;
  return {
    index,
    r,
    g,
    b,
    hex: `#${cleanHex.toLowerCase()}`,
    u32,
    isTransparent: index === 0
  };
}

/** Utility to convert 32-bit 0xRRGGBB integer to PaletteColor */
export function u32ToPaletteColor(u32: number, index: number): PaletteColor {
  const r = (u32 >> 16) & 0xff;
  const g = (u32 >> 8) & 0xff;
  const b = u32 & 0xff;
  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  return {
    index,
    r,
    g,
    b,
    hex,
    u32: (r << 16) | (g << 8) | b,
    isTransparent: index === 0
  };
}
