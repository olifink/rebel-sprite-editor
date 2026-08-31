# Rebel Sprite Editor

> **Modern 8-Bit 4bpp Sprite & Tile Sheet Forge for the Rebel Bare-Metal Forth System**  
> An offline-capable Progressive Web Application (PWA) designed to craft, edit, animate, and export 16-color 4bpp sprite banks into raw binary `.SPR` files, TypeScript (`.ts`), Rebel Forth (`.fs`), C++ (`.cpp` / `.h`), and PNG spritesheet atlases.

---

## 💡 Context & Motivation

**Rebel** is a bare-metal, Forth-first computing environment built from the ground up — rejecting modern OS bloat, layered background daemons, complex filesystems, and modal friction in pursuit of an immediate, appliance-like computing experience.

In a system operating directly on bare metal (across **Rebel-Sim** TypeScript simulator, **Rebel-ROM** Raspberry Pi C++ kernel, and **Rebel-Board** Pico 2 RISC-V hardware), graphics rendering relies on crisp, pre-compiled 4bpp sprite and tile banks tagged with `SPRT`. Rather than initializing heavy graphics engines at runtime, Rebel blits 4bpp nibble pairs directly from static memory into framebuffers.

**Rebel Sprite Editor** is the official visual tooling companion for sprite and tile banks defined in [`SPRITE-BANK.md`](SPRITE-BANK.md). It allows developers and game designers to draw, transform, animate, and export custom pixel assets optimized for low-level blitters and microcontrollers.

---

## ✨ Features

- **4bpp 16-Color Sprite Bank Format (`SPRT` / `.SPR`)**:
  - Full adherence to [`SPRITE-BANK.md`](SPRITE-BANK.md) format specifications.
  - 16-entry 32-bit `0xRRGGBB` embedded palette (64 bytes total palette size).
  - Palette Index 0 reserved as transparent color-key.
  - Multi-sprite / tile definitions with variable dimensions in multiples of 8 ($8\times 8, 16\times 16, 24\times 24, 32\times 32, 48\times 48, 64\times 64$, etc.).
  - Hardware blit attribute flags: `H-FLIP` (Bit 0) and `V-FLIP` (Bit 1).
  - Built-in binary presets in `public/sprites/`: **Rebel Rogue** (`rebel-rogue.SPR`), **Retro Platformer** (`retro-platformer.SPR`), and **UI Tileset** (`ui-tileset.SPR`).

- **Interactive Pixel Canvas Editor**:
  - **Drawing Tools**: Pencil (Draw Active Color), Brush (2x2 Pixels), Eraser (Color 0 / Transparent), Eyedropper / Color Picker, Line Tool, Rectangle Outline, Rectangle Fill, Circle Outline, Circle Fill, and Bucket Flood Fill.
  - **Grid Guides**: 1px Pixel Grid toggle and 8x8 Character Tile Division Grid toggle (for multi-tile sprites like $16\times 16 = 2\times 2$ tiles).
  - **Zoom Controls**: Customizable magnification ($8\times$ to $36\times$).
  - **Live Coordinate Tracker**: Displays real-time cursor $X, Y$ coordinate position.
  - **Transformation Bar**: 90° Clockwise Rotation, Horizontal Flip, Vertical Flip, Copy / Paste Sprite, Clear, and Character Reset (restores preset state).
  - **Nudge / Shift D-Pad**: Single and batch pixel nudging (Up, Down, Left, Right).

- **16-Color Palette Bar & Editor**:
  - 16 interactive swatches with primary (left-click) and secondary (right-click) selection.
  - Index 0 marked with a distinct transparency indicator.
  - Direct RGB / Hex color editing via color picker.
  - Built-in palette presets: **Sweetie 16**, **ZX Spectrum 16**, **PICO-8**, **DawnBringer 16 (DB16)**, **Commodore 64**, **Game Boy 16-Shade**, **CGA 16**, and **Cyberpunk Neon 16**.

- **4bpp Row Nibbles & Bytes Inspector**:
  - Real-time display of packed 4bpp nibbles and hex byte values (`0x44`, `0x4F`, `0x1F`) for every row.
  - Direct visualization of how high/low nibbles map to left/right pixel pairs.

- **Sprite Bank Manager & Navigator**:
  - Visual grid previewing all sprites with live aspect-ratio thumbnails, index badges (`#0`), names, dimensions, and flag badges (`H`, `V`).
  - Search filtering by name (`hero`), index (`#0`), or dimension (`16x16`).
  - Category filters: *All*, *Sprites (≥16px)*, *Tiles (8x8)*, and *Non-Empty Only*.
  - Add (+), duplicate, delete, and resize sprite dimensions dynamically.

- **Live Animation & Scene Sandbox**:
  - **Animation Player**: Play multi-frame sprite sequences (e.g. `0, 1, 2, 3` or custom loop `0, 1, 2, 1`) with adjustable FPS speed (1 to 30 FPS), play/pause, step controls, and custom scale ($1\times$ to $8\times$).
  - **2D Tilemap Stage**: Interactive playground canvas to stamp and arrange tiles and sprites on a grid.
  - **Background Selectors**: Dark Grid, Pure Black, CRT Matrix Green, Amber CRT, and Retro Navy.
  - Export preview output directly to PNG images.

- **Import, Merge & Export Options**:
  - **Raw Binary `.SPR`**: Download exact binary `.SPR` files (with 6-byte `'RASPRT'` header) or load external `.SPR` files via file picker or full-screen Drag & Drop.
  - **Merge `.SPR` Overlay**: Merge an external `.SPR` binary file directly onto the active workspace, updating defined non-empty sprites while preserving existing workspace sprites.
  - **TypeScript Source (`.ts`)**: Code generator matching `examples/sprite-rebel-rogue.ts` with metadata and pixel helper functions.
  - **C++ Source (`.cpp` & `.h`)**: Code generator matching `examples/sprite_rebel_rogue.cpp` and `examples/sprite_rebel_rogue.h` with `TSpriteBank` struct definitions.
  - **Rebel Forth (`.fs`)**: Code generator matching `examples/sprite-rebel-rogue.fs` with `HEX` palette tables and `SPRT` bank initialization.
  - **PNG Spritesheet & JSON Atlas**: Generates packed spritesheet PNG image and JSON atlas descriptors for web canvas and retro game engines.

- **Offline-Capable PWA & Material 3 Design**:
  - Built with Angular 22+ and Angular Material 3 Expressive styling with dark/light theme switching.
  - PWA Service Worker precaching with installation support.

---

## 📐 Sprite Bank Format & Memory Layout

According to [`SPRITE-BANK.md`](SPRITE-BANK.md), every saved `.SPR` file starts with the standard 6-byte `'R','A','S','P','R','T'` header, followed by the bank payload.

```
+-------------------------------------------------------------------+
| Byte 0..5: 'R', 'A', 'S', 'P', 'R', 'T' (Asset Tag Header)        |
+-------------------------------------------------------------------+
| Offset 0..63: 16 x 0xRRGGBB Palette Entries (4 bytes each)         |
+-------------------------------------------------------------------+
| Offset 64..(64 + 4*N - 1): N x Entry Headers (4 bytes each)       |
|   Byte 0: width in pixels (multiple of 8)                         |
|   Byte 1: height in pixels (multiple of 8)                        |
|   Byte 2: attribute flags (bit 0 = H-FLIP, bit 1 = V-FLIP)        |
|   Byte 3: reserved (0x00)                                         |
+-------------------------------------------------------------------+
| Offset (64 + 4*N)..: Contiguous 4bpp Pixel Data Blocks            |
|   Entry size = (width / 2) * height bytes                         |
|   One byte encodes two horizontal pixels (High = Left, Low = Right)|
+-------------------------------------------------------------------+
```

### 4bpp Pixel Nibble Encoding Example
For a $16 \times 16$ sprite, each row of 16 pixels is stored in 8 bytes:

```text
Byte 0:  [ Pixel 0 (High Nibble: 0x4) | Pixel 1 (Low Nibble: 0x4) ]  -> 0x44
Byte 1:  [ Pixel 2 (High Nibble: 0x4) | Pixel 3 (Low Nibble: 0xF) ]  -> 0x4F
Byte 2:  [ Pixel 4 (High Nibble: 0xF) | Pixel 5 (Low Nibble: 0xF) ]  -> 0xFF
...
```

### Offset Calculation Formula
No offset table is stored in the bank. The pixel offset of entry $n$ is computed dynamically:

$$\text{offset}[n] = 64 + 4N + \sum_{i < n} \left(\frac{\text{width}[i]}{2} \times \text{height}[i]\right)$$

---

## 🛠️ Development & Building

### Prerequisites
- Node.js `v20+` or `v22+` / `v24+`
- npm `v10+` / `v12+`

### Setup & Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/olifink/rebel-sprite-editor.git
   cd rebel-sprite-editor
   ```

2. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Start local development server**:
   ```bash
   npm start
   ```
   Navigate to `http://localhost:4200/`.

4. **Run Unit Tests**:
   ```bash
   npx vitest run
   ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🚀 Deployment to GitHub Pages

This project includes an automated GitHub Action workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) that builds and deploys the PWA to GitHub Pages on every push to `main`/`master`.

To build manually for GitHub Pages with custom base-href:
```bash
npm run build:gh-pages
```

Published Live PWA: [https://olifink.github.io/rebel-sprite-editor](https://olifink.github.io/rebel-sprite-editor)

---

## 📄 License

MIT License. Designed and built for the **Rebel** computing project.
