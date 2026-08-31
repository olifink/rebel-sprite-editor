import { Injectable, signal, computed } from '@angular/core';
import {
  SpriteEntry,
  PaletteColor,
  PALETTE_PRESETS,
  PALETTE_ENTRIES,
  PALETTE_SIZE_BYTES,
  ENTRY_HEADER_SIZE,
  TAG_HEADER_MAGIC,
  hexToPaletteColor,
  u32ToPaletteColor
} from '../models/sprite.model';
import { getRebelRoguePreset, getRetroPlatformerPreset, getUiTilesetPreset } from '../models/presets.data';

@Injectable({
  providedIn: 'root'
})
export class SpriteService {
  bankName = signal<string>('rebel_rogue');
  selectedSpriteIndex = signal<number>(0);
  selectedColorIndex = signal<number>(1); // Primary draw color index (0..15)
  secondaryColorIndex = signal<number>(0); // Secondary / transparent color (0..15)
  copiedSprite = signal<SpriteEntry | null>(null);

  // Active palette (16 colors)
  palette = signal<PaletteColor[]>([]);
  activePalettePresetId = signal<string>('sweetie16');

  // Sprite list
  sprites = signal<SpriteEntry[]>([]);

  // Default reference snapshot for detecting modifications
  private defaultSprites: SpriteEntry[] = [];
  bankLoaded = signal<boolean>(false);

  // Undo / Redo history
  private historyStack: { sprites: SpriteEntry[]; palette: PaletteColor[]; bankName: string }[] = [];
  private redoStack: { sprites: SpriteEntry[]; palette: PaletteColor[]; bankName: string }[] = [];
  private readonly MAX_HISTORY = 40;

  canUndo = signal<boolean>(false);
  canRedo = signal<boolean>(false);

  // Computed signals
  selectedSprite = computed<SpriteEntry | null>(() => {
    const list = this.sprites();
    const idx = this.selectedSpriteIndex();
    if (idx >= 0 && idx < list.length) {
      return list[idx];
    }
    return list.length > 0 ? list[0] : null;
  });

  totalSprites = computed(() => this.sprites().length);

  totalMemoryBytes = computed(() => {
    const list = this.sprites();
    let total = PALETTE_SIZE_BYTES + ENTRY_HEADER_SIZE * list.length;
    for (const s of list) {
      total += s.pixelData.length;
    }
    return total;
  });

  formattedMemorySize = computed(() => {
    const bytes = this.totalMemoryBytes();
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(2)} KB (${bytes.toLocaleString()} bytes)`;
  });

  paletteColorsHex = computed(() => this.palette().map(p => p.hex));

  constructor() {
    this.initDefaultPreset();
    this.updateHistoryState();
  }

  private initDefaultPreset() {
    const preset = getRebelRoguePreset();
    this.loadPresetData(preset.name, preset.paletteId, preset.sprites);
  }

  loadPresetData(name: string, paletteId: string, spriteList: SpriteEntry[]) {
    this.bankName.set(name);
    this.activePalettePresetId.set(paletteId);

    const palPreset = PALETTE_PRESETS.find(p => p.id === paletteId) || PALETTE_PRESETS[0];
    const newPalette = palPreset.colors.map((hex, idx) => hexToPaletteColor(hex, idx));
    this.palette.set(newPalette);

    // Deep clone sprites
    const clonedSprites: SpriteEntry[] = spriteList.map((s, idx) => ({
      ...s,
      id: idx,
      pixelData: new Uint8Array(s.pixelData)
    }));

    this.sprites.set(clonedSprites);
    this.defaultSprites = clonedSprites.map(s => ({
      ...s,
      pixelData: new Uint8Array(s.pixelData)
    }));

    this.selectedSpriteIndex.set(0);
    this.historyStack = [];
    this.redoStack = [];
    this.updateHistoryState();
    this.bankLoaded.set(true);
  }

  // --- Undo / Redo Management ---

  private pushHistory() {
    const currentSnapshot = {
      sprites: this.sprites().map(s => ({ ...s, pixelData: new Uint8Array(s.pixelData) })),
      palette: this.palette().map(p => ({ ...p })),
      bankName: this.bankName()
    };
    this.historyStack.push(currentSnapshot);
    if (this.historyStack.length > this.MAX_HISTORY) {
      this.historyStack.shift();
    }
    this.redoStack = [];
    this.updateHistoryState();
  }

  private updateHistoryState() {
    this.canUndo.set(this.historyStack.length > 0);
    this.canRedo.set(this.redoStack.length > 0);
  }

  undo() {
    if (this.historyStack.length === 0) return;
    const prev = this.historyStack.pop()!;
    const current = {
      sprites: this.sprites().map(s => ({ ...s, pixelData: new Uint8Array(s.pixelData) })),
      palette: this.palette().map(p => ({ ...p })),
      bankName: this.bankName()
    };
    this.redoStack.push(current);

    this.sprites.set(prev.sprites);
    this.palette.set(prev.palette);
    this.bankName.set(prev.bankName);
    this.updateHistoryState();
  }

  redo() {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop()!;
    const current = {
      sprites: this.sprites().map(s => ({ ...s, pixelData: new Uint8Array(s.pixelData) })),
      palette: this.palette().map(p => ({ ...p })),
      bankName: this.bankName()
    };
    this.historyStack.push(current);

    this.sprites.set(next.sprites);
    this.palette.set(next.palette);
    this.bankName.set(next.bankName);
    this.updateHistoryState();
  }

  // --- Sprite Selection & Manipulation ---

  selectSprite(index: number) {
    if (index >= 0 && index < this.sprites().length) {
      this.selectedSpriteIndex.set(index);
    }
  }

  getPixel(spriteId: number, x: number, y: number): number {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return 0;
    const sprite = list[spriteId];
    if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) return 0;

    const bytesPerRow = sprite.width / 2;
    const byteIdx = y * bytesPerRow + (x >> 1);
    const byteVal = sprite.pixelData[byteIdx];

    return (x % 2 === 0) ? ((byteVal >> 4) & 0x0f) : (byteVal & 0x0f);
  }

  setPixel(spriteId: number, x: number, y: number, colorIndex: number) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const sprite = list[spriteId];
    if (x < 0 || x >= sprite.width || y < 0 || y >= sprite.height) return;

    const currentColor = this.getPixel(spriteId, x, y);
    if (currentColor === colorIndex) return;

    this.pushHistory();

    const newPixelData = new Uint8Array(sprite.pixelData);
    const bytesPerRow = sprite.width / 2;
    const byteIdx = y * bytesPerRow + (x >> 1);
    const currentByte = newPixelData[byteIdx];

    const safeColor = colorIndex & 0x0f;
    if (x % 2 === 0) {
      newPixelData[byteIdx] = (safeColor << 4) | (currentByte & 0x0f);
    } else {
      newPixelData[byteIdx] = (currentByte & 0xf0) | safeColor;
    }

    const updatedSprites = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        pixelData: newPixelData,
        modified: true,
        isEmpty: newPixelData.every(b => b === 0)
      };
    });

    this.sprites.set(updatedSprites);
  }

  setSpritePixelData(spriteId: number, newPixelData: Uint8Array) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;

    this.pushHistory();
    const updatedSprites = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        pixelData: new Uint8Array(newPixelData),
        modified: true,
        isEmpty: newPixelData.every(b => b === 0)
      };
    });
    this.sprites.set(updatedSprites);
  }

  // --- Sprite Transformations ---

  shiftSprite(spriteId: number, direction: 'up' | 'down' | 'left' | 'right', wrap: boolean = false) {
    this.shiftMultipleSprites([spriteId], direction, wrap);
  }

  shiftMultipleSprites(ids: number[], direction: 'up' | 'down' | 'left' | 'right', wrap: boolean = false) {
    if (!ids || ids.length === 0) return;
    this.pushHistory();

    const list = this.sprites();
    const idSet = new Set(ids);

    const updated = list.map((sprite, idx) => {
      if (!idSet.has(idx)) return sprite;

      const w = sprite.width;
      const h = sprite.height;
      const newPixels = new Uint8Array(sprite.pixelData.length);
      const bytesPerRow = w / 2;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let srcX = x;
          let srcY = y;

          if (direction === 'up') srcY = y + 1;
          else if (direction === 'down') srcY = y - 1;
          else if (direction === 'left') srcX = x + 1;
          else if (direction === 'right') srcX = x - 1;

          let color = 0;
          if (wrap) {
            srcX = (srcX + w) % w;
            srcY = (srcY + h) % h;
            color = this.getPixel(idx, srcX, srcY);
          } else {
            if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
              color = this.getPixel(idx, srcX, srcY);
            }
          }

          const targetByte = y * bytesPerRow + (x >> 1);
          const safeColor = color & 0x0f;
          if (x % 2 === 0) {
            newPixels[targetByte] = (safeColor << 4) | (newPixels[targetByte] & 0x0f);
          } else {
            newPixels[targetByte] = (newPixels[targetByte] & 0xf0) | safeColor;
          }
        }
      }

      return {
        ...sprite,
        pixelData: newPixels,
        modified: true,
        isEmpty: newPixels.every(b => b === 0)
      };
    });

    this.sprites.set(updated);
  }

  rotateSprite(spriteId: number, direction: 'cw' | 'ccw') {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const sprite = list[spriteId];

    this.pushHistory();

    const w = sprite.width;
    const h = sprite.height;
    // For square sprites, rotation preserves dimensions. For non-square, rotate grid within bounding box or swap dimensions if multiples of 8.
    const newW = h;
    const newH = w;
    const bytesPerRow = newW / 2;
    const newPixels = new Uint8Array(bytesPerRow * newH);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = this.getPixel(spriteId, x, y);
        let targetX = 0;
        let targetY = 0;

        if (direction === 'cw') {
          targetX = h - 1 - y;
          targetY = x;
        } else {
          targetX = y;
          targetY = w - 1 - x;
        }

        const targetByte = targetY * bytesPerRow + (targetX >> 1);
        const safeColor = color & 0x0f;
        if (targetX % 2 === 0) {
          newPixels[targetByte] = (safeColor << 4) | (newPixels[targetByte] & 0x0f);
        } else {
          newPixels[targetByte] = (newPixels[targetByte] & 0xf0) | safeColor;
        }
      }
    }

    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        width: newW,
        height: newH,
        pixelData: newPixels,
        modified: true,
        isEmpty: newPixels.every(b => b === 0)
      };
    });

    this.sprites.set(updated);
  }

  flipSprite(spriteId: number, axis: 'h' | 'v') {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const sprite = list[spriteId];

    this.pushHistory();

    const w = sprite.width;
    const h = sprite.height;
    const bytesPerRow = w / 2;
    const newPixels = new Uint8Array(sprite.pixelData.length);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcX = (axis === 'h') ? (w - 1 - x) : x;
        const srcY = (axis === 'v') ? (h - 1 - y) : y;
        const color = this.getPixel(spriteId, srcX, srcY);

        const targetByte = y * bytesPerRow + (x >> 1);
        const safeColor = color & 0x0f;
        if (x % 2 === 0) {
          newPixels[targetByte] = (safeColor << 4) | (newPixels[targetByte] & 0x0f);
        } else {
          newPixels[targetByte] = (newPixels[targetByte] & 0xf0) | safeColor;
        }
      }
    }

    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        pixelData: newPixels,
        modified: true,
        isEmpty: newPixels.every(b => b === 0)
      };
    });

    this.sprites.set(updated);
  }

  toggleSpriteFlag(spriteId: number, flag: 'hFlip' | 'vFlip') {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;

    this.pushHistory();
    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        [flag]: !s[flag],
        modified: true
      };
    });
    this.sprites.set(updated);
  }

  replaceColor(spriteId: number, oldIndex: number, newIndex: number) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const sprite = list[spriteId];

    this.pushHistory();

    const newPixels = new Uint8Array(sprite.pixelData.length);
    for (let i = 0; i < sprite.pixelData.length; i++) {
      const b = sprite.pixelData[i];
      let p0 = (b >> 4) & 0x0f;
      let p1 = b & 0x0f;

      if (p0 === oldIndex) p0 = newIndex;
      if (p1 === oldIndex) p1 = newIndex;

      newPixels[i] = ((p0 & 0x0f) << 4) | (p1 & 0x0f);
    }

    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        pixelData: newPixels,
        modified: true,
        isEmpty: newPixels.every(val => val === 0)
      };
    });

    this.sprites.set(updated);
  }

  clearSprite(spriteId: number) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;

    this.pushHistory();
    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      const blank = new Uint8Array(s.pixelData.length);
      return {
        ...s,
        pixelData: blank,
        modified: true,
        isEmpty: true
      };
    });

    this.sprites.set(updated);
  }

  resetSprite(spriteId: number) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;

    const original = this.defaultSprites[spriteId];
    if (!original) {
      this.clearSprite(spriteId);
      return;
    }

    this.pushHistory();
    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...original,
        pixelData: new Uint8Array(original.pixelData),
        modified: false
      };
    });

    this.sprites.set(updated);
  }

  copySprite(spriteId: number) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const s = list[spriteId];
    this.copiedSprite.set({
      ...s,
      pixelData: new Uint8Array(s.pixelData)
    });
  }

  pasteSprite(spriteId: number) {
    const copied = this.copiedSprite();
    if (!copied) return;
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;

    this.pushHistory();
    const target = list[spriteId];

    // If dimensions match, direct paste; otherwise copy fitting region
    let newPixels: Uint8Array;
    if (target.width === copied.width && target.height === copied.height) {
      newPixels = new Uint8Array(copied.pixelData);
    } else {
      newPixels = new Uint8Array((target.width / 2) * target.height);
      const minW = Math.min(target.width, copied.width);
      const minH = Math.min(target.height, copied.height);
      for (let y = 0; y < minH; y++) {
        for (let x = 0; x < minW; x++) {
          const srcByte = y * (copied.width / 2) + (x >> 1);
          const color = (x % 2 === 0) ? ((copied.pixelData[srcByte] >> 4) & 0x0f) : (copied.pixelData[srcByte] & 0x0f);

          const tgtByte = y * (target.width / 2) + (x >> 1);
          if (x % 2 === 0) {
            newPixels[tgtByte] = (color << 4) | (newPixels[tgtByte] & 0x0f);
          } else {
            newPixels[tgtByte] = (newPixels[tgtByte] & 0xf0) | color;
          }
        }
      }
    }

    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        pixelData: newPixels,
        modified: true,
        isEmpty: newPixels.every(b => b === 0)
      };
    });

    this.sprites.set(updated);
  }

  // --- Sprite Entry List Operations ---

  addSprite(width: number = 16, height: number = 16, name?: string): number {
    this.pushHistory();
    const list = this.sprites();
    const id = list.length;
    const spriteName = name || `sprite_${id}`;
    const cleanWidth = Math.max(8, Math.round(width / 8) * 8);
    const cleanHeight = Math.max(8, Math.round(height / 8) * 8);

    const newSprite: SpriteEntry = {
      id,
      name: spriteName,
      width: cleanWidth,
      height: cleanHeight,
      hFlip: false,
      vFlip: false,
      modified: true,
      isEmpty: true,
      pixelData: new Uint8Array((cleanWidth / 2) * cleanHeight)
    };

    this.sprites.set([...list, newSprite]);
    this.selectedSpriteIndex.set(id);
    return id;
  }

  duplicateSprite(spriteId: number): number {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return -1;
    const source = list[spriteId];

    this.pushHistory();
    const newId = list.length;
    const duplicate: SpriteEntry = {
      id: newId,
      name: `${source.name}_copy`,
      width: source.width,
      height: source.height,
      hFlip: source.hFlip,
      vFlip: source.vFlip,
      modified: true,
      isEmpty: source.isEmpty,
      pixelData: new Uint8Array(source.pixelData)
    };

    this.sprites.set([...list, duplicate]);
    this.selectedSpriteIndex.set(newId);
    return newId;
  }

  deleteSprite(spriteId: number) {
    const list = this.sprites();
    if (list.length <= 1) return; // Keep at least 1 sprite
    if (spriteId < 0 || spriteId >= list.length) return;

    this.pushHistory();
    const remaining = list.filter((_, idx) => idx !== spriteId).map((s, newIdx) => ({
      ...s,
      id: newIdx
    }));

    this.sprites.set(remaining);
    const currentSelected = this.selectedSpriteIndex();
    if (currentSelected >= remaining.length) {
      this.selectedSpriteIndex.set(remaining.length - 1);
    }
  }

  resizeSprite(spriteId: number, newWidth: number, newHeight: number) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const sprite = list[spriteId];

    const cleanW = Math.max(8, Math.round(newWidth / 8) * 8);
    const cleanH = Math.max(8, Math.round(newHeight / 8) * 8);
    if (sprite.width === cleanW && sprite.height === cleanH) return;

    this.pushHistory();

    const newPixels = new Uint8Array((cleanW / 2) * cleanH);
    const minW = Math.min(sprite.width, cleanW);
    const minH = Math.min(sprite.height, cleanH);

    for (let y = 0; y < minH; y++) {
      for (let x = 0; x < minW; x++) {
        const color = this.getPixel(spriteId, x, y);
        const tgtByte = y * (cleanW / 2) + (x >> 1);
        if (x % 2 === 0) {
          newPixels[tgtByte] = (color << 4) | (newPixels[tgtByte] & 0x0f);
        } else {
          newPixels[tgtByte] = (newPixels[tgtByte] & 0xf0) | color;
        }
      }
    }

    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return {
        ...s,
        width: cleanW,
        height: cleanH,
        pixelData: newPixels,
        modified: true,
        isEmpty: newPixels.every(b => b === 0)
      };
    });

    this.sprites.set(updated);
  }

  setSpriteName(spriteId: number, name: string) {
    const list = this.sprites();
    if (spriteId < 0 || spriteId >= list.length) return;
    const clean = name.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const updated = list.map((s, idx) => {
      if (idx !== spriteId) return s;
      return { ...s, name: clean };
    });
    this.sprites.set(updated);
  }

  reorderSprite(fromIndex: number, toIndex: number) {
    const list = [...this.sprites()];
    if (fromIndex < 0 || fromIndex >= list.length || toIndex < 0 || toIndex >= list.length || fromIndex === toIndex) return;

    this.pushHistory();
    const item = list.splice(fromIndex, 1)[0];
    list.splice(toIndex, 0, item);

    const reindexed = list.map((s, idx) => ({ ...s, id: idx }));
    this.sprites.set(reindexed);
    this.selectedSpriteIndex.set(toIndex);
  }

  clearAllSprites() {
    this.pushHistory();
    const singleBlank: SpriteEntry = {
      id: 0,
      name: 'sprite_0',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: true,
      isEmpty: true,
      pixelData: new Uint8Array(128)
    };
    this.sprites.set([singleBlank]);
    this.selectedSpriteIndex.set(0);
  }

  // --- Palette Operations ---

  setPaletteColor(index: number, hex: string) {
    if (index < 0 || index >= PALETTE_ENTRIES) return;
    this.pushHistory();

    const pal = this.palette().map((c, i) => {
      if (i !== index) return c;
      return hexToPaletteColor(hex, index);
    });

    this.palette.set(pal);
  }

  setPalettePreset(presetId: string) {
    const preset = PALETTE_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    this.pushHistory();
    this.activePalettePresetId.set(presetId);
    const newPal = preset.colors.map((hex, idx) => hexToPaletteColor(hex, idx));
    this.palette.set(newPal);
  }

  // --- Binary Serialization & Parsing (.SPR) ---

  loadSprBinary(arrayBuffer: ArrayBuffer): boolean {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      let payloadOffset = 0;

      // Check for 6-byte magic header 'RASPRT' (0x52, 0x41, 0x53, 0x50, 0x52, 0x54)
      if (
        bytes.length >= 6 &&
        bytes[0] === TAG_HEADER_MAGIC[0] &&
        bytes[1] === TAG_HEADER_MAGIC[1] &&
        bytes[2] === TAG_HEADER_MAGIC[2] &&
        bytes[3] === TAG_HEADER_MAGIC[3] &&
        bytes[4] === TAG_HEADER_MAGIC[4] &&
        bytes[5] === TAG_HEADER_MAGIC[5]
      ) {
        payloadOffset = 6;
      }

      const payload = bytes.subarray(payloadOffset);
      if (payload.length < PALETTE_SIZE_BYTES) {
        return false;
      }

      this.pushHistory();

      // Read 16 palette entries (64 bytes, 4 bytes each 0xRRGGBB Little-Endian [B, G, R, 0x00])
      const newPalette: PaletteColor[] = [];
      for (let i = 0; i < PALETTE_ENTRIES; i++) {
        const offset = i * 4;
        const b = payload[offset];
        const g = payload[offset + 1];
        const r = payload[offset + 2];
        const u32 = (r << 16) | (g << 8) | b;
        newPalette.push(u32ToPaletteColor(u32, i));
      }
      this.palette.set(newPalette);

      // Determine entry count N
      // Total payload size = 64 + 4*N + sum((w_i/2)*h_i)
      const payloadSize = payload.length;
      let entryCount = 0;
      let currentHeaderOffset = PALETTE_SIZE_BYTES;

      // First pass: find candidate N that matches exact payload size
      for (let k = 1; k <= 1024; k++) {
        const headerEnd = PALETTE_SIZE_BYTES + k * ENTRY_HEADER_SIZE;
        if (headerEnd > payloadSize) break;

        let totalPixelBytes = 0;
        let validHeaders = true;
        for (let j = 0; j < k; j++) {
          const hOff = PALETTE_SIZE_BYTES + j * ENTRY_HEADER_SIZE;
          const w = payload[hOff];
          const h = payload[hOff + 1];
          if (w === 0 || h === 0 || w % 8 !== 0 || h % 8 !== 0) {
            validHeaders = false;
            break;
          }
          totalPixelBytes += (w / 2) * h;
        }

        if (validHeaders && headerEnd + totalPixelBytes === payloadSize) {
          entryCount = k;
          break;
        }
      }

      // Fallback: If exact match not found (e.g. padded file), parse sequentially while valid
      if (entryCount === 0) {
        let k = 0;
        let runningPixelSum = 0;
        while (PALETTE_SIZE_BYTES + (k + 1) * ENTRY_HEADER_SIZE <= payloadSize) {
          const hOff = PALETTE_SIZE_BYTES + k * ENTRY_HEADER_SIZE;
          const w = payload[hOff];
          const h = payload[hOff + 1];
          if (w === 0 || h === 0 || w % 8 !== 0 || h % 8 !== 0) break;
          runningPixelSum += (w / 2) * h;
          k++;
          if (PALETTE_SIZE_BYTES + k * ENTRY_HEADER_SIZE + runningPixelSum >= payloadSize) {
            entryCount = k;
            break;
          }
        }
        if (entryCount === 0) entryCount = k;
      }

      if (entryCount === 0) {
        // Fallback single 16x16 default if no valid headers
        entryCount = 1;
      }

      // Parse headers
      const entries: { width: number; height: number; flags: number }[] = [];
      for (let i = 0; i < entryCount; i++) {
        const hOff = PALETTE_SIZE_BYTES + i * ENTRY_HEADER_SIZE;
        let w = payload[hOff] || 16;
        let h = payload[hOff + 1] || 16;
        if (w % 8 !== 0) w = Math.max(8, Math.round(w / 8) * 8);
        if (h % 8 !== 0) h = Math.max(8, Math.round(h / 8) * 8);
        const flags = payload[hOff + 2] || 0;
        entries.push({ width: w, height: h, flags });
      }

      // Extract pixel data
      const pixelDataStart = PALETTE_SIZE_BYTES + entryCount * ENTRY_HEADER_SIZE;
      let currentPixelOffset = pixelDataStart;
      const parsedSprites: SpriteEntry[] = [];

      for (let i = 0; i < entries.length; i++) {
        const { width, height, flags } = entries[i];
        const dataLen = (width / 2) * height;
        const spritePixels = new Uint8Array(dataLen);

        if (currentPixelOffset + dataLen <= payload.length) {
          spritePixels.set(payload.subarray(currentPixelOffset, currentPixelOffset + dataLen));
        }
        currentPixelOffset += dataLen;

        parsedSprites.push({
          id: i,
          name: `sprite_${i}`,
          width,
          height,
          hFlip: (flags & 1) !== 0,
          vFlip: (flags & 2) !== 0,
          modified: false,
          isEmpty: spritePixels.every(b => b === 0),
          pixelData: spritePixels
        });
      }

      this.sprites.set(parsedSprites);
      this.defaultSprites = parsedSprites.map(s => ({
        ...s,
        pixelData: new Uint8Array(s.pixelData)
      }));
      this.selectedSpriteIndex.set(0);
      return true;
    } catch {
      return false;
    }
  }

  mergeSprBinary(arrayBuffer: ArrayBuffer): number {
    try {
      const bytes = new Uint8Array(arrayBuffer);
      let payloadOffset = 0;
      if (
        bytes.length >= 6 &&
        bytes[0] === TAG_HEADER_MAGIC[0] &&
        bytes[1] === TAG_HEADER_MAGIC[1] &&
        bytes[2] === TAG_HEADER_MAGIC[2] &&
        bytes[3] === TAG_HEADER_MAGIC[3] &&
        bytes[4] === TAG_HEADER_MAGIC[4] &&
        bytes[5] === TAG_HEADER_MAGIC[5]
      ) {
        payloadOffset = 6;
      }

      const payload = bytes.subarray(payloadOffset);
      if (payload.length < PALETTE_SIZE_BYTES) return 0;

      // Extract incoming sprites
      const tempService = new SpriteService();
      tempService.loadSprBinary(arrayBuffer);
      const incomingSprites = tempService.sprites();

      if (incomingSprites.length === 0) return 0;

      this.pushHistory();
      const current = [...this.sprites()];
      let mergedCount = 0;

      for (let i = 0; i < incomingSprites.length; i++) {
        const incoming = incomingSprites[i];
        if (!incoming.isEmpty) {
          if (i < current.length) {
            current[i] = {
              ...incoming,
              id: i,
              name: current[i].name || incoming.name,
              modified: true
            };
          } else {
            current.push({
              ...incoming,
              id: current.length,
              modified: true
            });
          }
          mergedCount++;
        }
      }

      this.sprites.set(current);
      return mergedCount;
    } catch {
      return 0;
    }
  }

  exportSprBinaryBlob(includeMagicHeader: boolean = true): Blob {
    const spritesList = this.sprites();
    const pal = this.palette();

    const magicSize = includeMagicHeader ? 6 : 0;
    const paletteSize = PALETTE_SIZE_BYTES; // 64
    const headerListSize = spritesList.length * ENTRY_HEADER_SIZE;
    let pixelDataSize = 0;
    for (const s of spritesList) {
      pixelDataSize += s.pixelData.length;
    }

    const totalSize = magicSize + paletteSize + headerListSize + pixelDataSize;
    const buffer = new Uint8Array(totalSize);

    let offset = 0;

    // 1. Optional Magic Header 'RASPRT'
    if (includeMagicHeader) {
      buffer.set(TAG_HEADER_MAGIC, offset);
      offset += 6;
    }

    // 2. Palette (64 bytes: 16 entries x 4 bytes Little-Endian [B, G, R, 0x00])
    for (let i = 0; i < PALETTE_ENTRIES; i++) {
      const color = pal[i] || hexToPaletteColor('#000000', i);
      buffer[offset + 0] = color.b & 0xff;
      buffer[offset + 1] = color.g & 0xff;
      buffer[offset + 2] = color.r & 0xff;
      buffer[offset + 3] = 0x00;
      offset += 4;
    }

    // 3. Entry List Headers (4 bytes each: [width, height, flags, reserved])
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      let flags = 0;
      if (s.hFlip) flags |= 1;
      if (s.vFlip) flags |= 2;

      buffer[offset + 0] = s.width & 0xff;
      buffer[offset + 1] = s.height & 0xff;
      buffer[offset + 2] = flags & 0xff;
      buffer[offset + 3] = 0x00; // Reserved
      offset += 4;
    }

    // 4. Contiguous Pixel Data
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      buffer.set(s.pixelData, offset);
      offset += s.pixelData.length;
    }

    return new Blob([buffer as unknown as BlobPart], { type: 'application/octet-stream' });
  }

  // --- Source Code Exporters ---

  exportTsSource(bankNameInput?: string): string {
    const slug = (bankNameInput || this.bankName() || 'rebel_sprites').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const constPrefix = slug.toUpperCase();
    const spritesList = this.sprites();
    const pal = this.palette();

    const lines: string[] = [];
    lines.push(`/**`);
    lines.push(` * Rebel Sprite Bank: ${slug}`);
    lines.push(` * Generated by Rebel Sprite Editor`);
    lines.push(` *`);
    lines.push(` * Format: 4bpp, 16-entry 0xRRGGBB Palette, Contiguous 4bpp Pixel Data.`);
    lines.push(` * Entry Count: ${spritesList.length} sprite(s) / tile(s)`);
    lines.push(` */`);
    lines.push(``);
    lines.push(`export const ${constPrefix}_NAME = '${slug}';`);
    lines.push(`export const ${constPrefix}_ENTRY_COUNT = ${spritesList.length};`);
    lines.push(``);

    // 16 Palette entries
    lines.push(`// 16-Entry 0xRRGGBB Color Palette (Index 0 is Transparent / Color-Key)`);
    lines.push(`export const ${constPrefix}_PALETTE: readonly number[] = [`);
    for (let i = 0; i < PALETTE_ENTRIES; i++) {
      const c = pal[i] || hexToPaletteColor('#000000', i);
      const hexVal = '0x' + c.u32.toString(16).padStart(6, '0').toUpperCase();
      lines.push(`  ${hexVal}, // [${i.toString().padStart(2, ' ')}] ${c.hex} ${c.isTransparent ? '(Transparent)' : ''}`);
    }
    lines.push(`];`);
    lines.push(``);

    // Sprite Entry Metadata
    lines.push(`export interface SpriteEntryMetadata {`);
    lines.push(`  id: number;`);
    lines.push(`  name: string;`);
    lines.push(`  width: number;`);
    lines.push(`  height: number;`);
    lines.push(`  hFlip: boolean;`);
    lines.push(`  vFlip: boolean;`);
    lines.push(`  offset: number;`);
    lines.push(`  byteLength: number;`);
    lines.push(`}`);
    lines.push(``);
    lines.push(`export const ${constPrefix}_ENTRIES: readonly SpriteEntryMetadata[] = [`);

    let runningOffset = 64 + spritesList.length * 4;
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      const byteLen = s.pixelData.length;
      lines.push(`  { id: ${s.id}, name: '${s.name}', width: ${s.width}, height: ${s.height}, hFlip: ${s.hFlip}, vFlip: ${s.vFlip}, offset: ${runningOffset}, byteLength: ${byteLen} },`);
      runningOffset += byteLen;
    }
    lines.push(`];`);
    lines.push(``);

    // Contiguous Pixel Data
    lines.push(`// prettier-ignore`);
    lines.push(`export const ${constPrefix}_PIXEL_DATA = new Uint8Array([`);

    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      lines.push(`  // Sprite #${i}: ${s.name} (${s.width}x${s.height} px, ${s.pixelData.length} bytes)`);
      const bytesPerRow = s.width / 2;
      for (let r = 0; r < s.height; r++) {
        const rowBytes: string[] = [];
        for (let c = 0; c < bytesPerRow; c++) {
          const b = s.pixelData[r * bytesPerRow + c];
          rowBytes.push('0x' + b.toString(16).padStart(2, '0').toUpperCase());
        }
        lines.push(`  ${rowBytes.join(', ')}, // row ${r}`);
      }
    }
    lines.push(`]);`);
    lines.push(``);

    // Helper functions
    const pascalName = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    lines.push(`/** Reads a 4bpp pixel (0..15) for a given sprite entry */`);
    lines.push(`export function get${pascalName}Pixel(entryId: number, x: number, y: number): number {`);
    lines.push(`  const entry = ${constPrefix}_ENTRIES[entryId];`);
    lines.push(`  if (!entry || x < 0 || x >= entry.width || y < 0 || y >= entry.height) return 0;`);
    lines.push(`  const start = entry.offset - (64 + ${constPrefix}_ENTRY_COUNT * 4);`);
    lines.push(`  const byteIdx = start + y * (entry.width / 2) + (x >> 1);`);
    lines.push(`  const byteVal = ${constPrefix}_PIXEL_DATA[byteIdx];`);
    lines.push(`  return (x % 2 === 0) ? ((byteVal >> 4) & 0x0F) : (byteVal & 0x0F);`);
    lines.push(`}`);
    lines.push(``);

    return lines.join('\n');
  }

  exportCppSource(bankNameInput?: string): { cpp: string; h: string } {
    const slug = (bankNameInput || this.bankName() || 'rebel_sprites').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const capName = slug.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
    const spritesList = this.sprites();
    const pal = this.palette();

    // Header (.h)
    const hLines: string[] = [];
    hLines.push(`#ifndef SPRITE_BANK_${slug.toUpperCase()}_H`);
    hLines.push(`#define SPRITE_BANK_${slug.toUpperCase()}_H`);
    hLines.push(``);
    hLines.push(`#include <stdint.h>`);
    hLines.push(``);
    hLines.push(`#ifdef __cplusplus`);
    hLines.push(`extern "C" {`);
    hLines.push(`#endif`);
    hLines.push(``);
    hLines.push(`typedef struct {`);
    hLines.push(`    uint8_t width;`);
    hLines.push(`    uint8_t height;`);
    hLines.push(`    uint8_t flags; // bit 0 = H-FLIP, bit 1 = V-FLIP`);
    hLines.push(`    uint8_t reserved;`);
    hLines.push(`} TSpriteEntry;`);
    hLines.push(``);
    hLines.push(`typedef struct {`);
    hLines.push(`    const char* name;`);
    hLines.push(`    uint16_t entry_count;`);
    hLines.push(`    const uint32_t* palette;`);
    hLines.push(`    const TSpriteEntry* entries;`);
    hLines.push(`    const uint8_t* pixel_data;`);
    hLines.push(`} TSpriteBank;`);
    hLines.push(``);
    hLines.push(`extern const TSpriteBank SpriteBank_${capName};`);
    hLines.push(``);
    hLines.push(`#ifdef __cplusplus`);
    hLines.push(`}`);
    hLines.push(`#endif`);
    hLines.push(``);
    hLines.push(`#endif // SPRITE_BANK_${slug.toUpperCase()}_H`);

    // Source (.cpp)
    const cppLines: string[] = [];
    cppLines.push(`//`);
    cppLines.push(`// sprite_${slug}.cpp`);
    cppLines.push(`// Generated by Rebel Sprite Editor`);
    cppLines.push(`//`);
    cppLines.push(`#include "sprite_${slug}.h"`);
    cppLines.push(``);

    // Palette
    cppLines.push(`static const uint32_t sprite_palette[16] = {`);
    for (let i = 0; i < PALETTE_ENTRIES; i++) {
      const c = pal[i] || hexToPaletteColor('#000000', i);
      const hexVal = '0x00' + c.u32.toString(16).padStart(6, '0').toUpperCase();
      cppLines.push(`    ${hexVal}, // [${i}] ${c.hex}`);
    }
    cppLines.push(`};`);
    cppLines.push(``);

    // Entry list
    cppLines.push(`static const TSpriteEntry sprite_entries[${spritesList.length}] = {`);
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      let flags = 0;
      if (s.hFlip) flags |= 1;
      if (s.vFlip) flags |= 2;
      cppLines.push(`    { ${s.width}, ${s.height}, 0x${flags.toString(16).padStart(2, '0').toUpperCase()}, 0 }, // #${i} ${s.name}`);
    }
    cppLines.push(`};`);
    cppLines.push(``);

    // Pixel data
    cppLines.push(`static const uint8_t sprite_pixel_data[] = {`);
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      cppLines.push(`    // Sprite #${i}: ${s.name} (${s.width}x${s.height})`);
      const bytesPerRow = s.width / 2;
      for (let r = 0; r < s.height; r++) {
        const rowBytes: string[] = [];
        for (let c = 0; c < bytesPerRow; c++) {
          const b = s.pixelData[r * bytesPerRow + c];
          rowBytes.push('0x' + b.toString(16).padStart(2, '0').toUpperCase());
        }
        cppLines.push(`    ${rowBytes.join(', ')},`);
      }
    }
    cppLines.push(`};`);
    cppLines.push(``);

    cppLines.push(`const TSpriteBank SpriteBank_${capName} = {`);
    cppLines.push(`    "${slug}",`);
    cppLines.push(`    ${spritesList.length},`);
    cppLines.push(`    sprite_palette,`);
    cppLines.push(`    sprite_entries,`);
    cppLines.push(`    sprite_pixel_data`);
    cppLines.push(`};`);
    cppLines.push(``);

    return {
      h: hLines.join('\n'),
      cpp: cppLines.join('\n')
    };
  }

  exportForthSource(bankNameInput?: string): string {
    const slug = (bankNameInput || this.bankName() || 'rebel_sprites').toLowerCase().replace(/[^a-z0-9]/g, '-');
    const spritesList = this.sprites();
    const pal = this.palette();

    const lines: string[] = [];
    lines.push(`\\ Rebel Forth Sprite Bank: ${slug}`);
    lines.push(`\\ Generated by Rebel Sprite Editor`);
    lines.push(`\\ Tag: SPRT, Entry Count: ${spritesList.length}`);
    lines.push(``);
    lines.push(`HEX`);
    lines.push(``);
    lines.push(`\\ 16-Color Palette (0xRRGGBB)`);
    lines.push(`CREATE ${slug.toUpperCase()}-PALETTE`);
    for (let i = 0; i < PALETTE_ENTRIES; i++) {
      const c = pal[i] || hexToPaletteColor('#000000', i);
      lines.push(`  ${c.u32.toString(16).toUpperCase()} ,  \\ [${i}] ${c.hex}`);
    }
    lines.push(``);

    lines.push(`\\ Sprite Metadata Table: width height flags reserved`);
    lines.push(`CREATE ${slug.toUpperCase()}-ENTRIES`);
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      let flags = 0;
      if (s.hFlip) flags |= 1;
      if (s.vFlip) flags |= 2;
      lines.push(`  ${s.width.toString(16).toUpperCase()} C, ${s.height.toString(16).toUpperCase()} C, ${flags.toString(16).toUpperCase()} C, 0 C,  \\ #${i} ${s.name}`);
    }
    lines.push(``);

    lines.push(`DECIMAL`);
    lines.push(``);
    return lines.join('\n');
  }

  exportSpritesheetAtlas(cols: number = 8): { canvas: HTMLCanvasElement; atlasJson: string } {
    const spritesList = this.sprites();
    const pal = this.palette();

    const maxSpriteW = Math.max(...spritesList.map(s => s.width), 16);
    const maxSpriteH = Math.max(...spritesList.map(s => s.height), 16);

    const actualCols = Math.min(cols, spritesList.length);
    const actualRows = Math.ceil(spritesList.length / actualCols);

    const canvas = document.createElement('canvas');
    canvas.width = actualCols * maxSpriteW;
    canvas.height = actualRows * maxSpriteH;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frames: Record<string, any> = {};

    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      const col = i % actualCols;
      const row = Math.floor(i / actualCols);
      const startX = col * maxSpriteW;
      const startY = row * maxSpriteH;

      frames[s.name || `sprite_${i}`] = {
        frame: { x: startX, y: startY, w: s.width, h: s.height },
        sourceSize: { w: s.width, h: s.height },
        spriteSourceSize: { x: 0, y: 0, w: s.width, h: s.height }
      };

      for (let y = 0; y < s.height; y++) {
        for (let x = 0; x < s.width; x++) {
          const colorIdx = this.getPixel(i, x, y);
          if (colorIdx > 0 && colorIdx < pal.length) {
            ctx.fillStyle = pal[colorIdx].hex;
            ctx.fillRect(startX + x, startY + y, 1, 1);
          }
        }
      }
    }

    const atlas = {
      frames,
      meta: {
        app: 'Rebel Sprite Editor',
        version: '1.0',
        image: `${this.bankName()}.png`,
        format: 'RGBA8888',
        size: { w: canvas.width, h: canvas.height },
        scale: '1'
      }
    };

    return {
      canvas,
      atlasJson: JSON.stringify(atlas, null, 2)
    };
  }
}
