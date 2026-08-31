import { describe, it, expect, beforeEach } from 'vitest';
import { SpriteService } from './sprite.service';
import { TAG_HEADER_MAGIC } from '../models/sprite.model';

describe('SpriteService', () => {
  let service: SpriteService;

  beforeEach(() => {
    service = new SpriteService();
  });

  it('should initialize with default preset sprites and palette', () => {
    expect(service.sprites().length).toBeGreaterThan(0);
    expect(service.palette().length).toBe(16);
    expect(service.palette()[0].isTransparent).toBe(true);
    expect(service.bankName()).toBe('rebel_rogue');
  });

  it('should correctly get and set 4bpp pixels', () => {
    const sprite = service.sprites()[0];
    expect(sprite).toBeDefined();

    // Set pixel (2, 3) to color 9
    service.setPixel(0, 2, 3, 9);
    expect(service.getPixel(0, 2, 3)).toBe(9);

    // Set pixel (3, 3) (adjacent horizontal pixel in same byte) to color 14
    service.setPixel(0, 3, 3, 14);
    expect(service.getPixel(0, 3, 3)).toBe(14);
    expect(service.getPixel(0, 2, 3)).toBe(9); // Ensure high nibble wasn't corrupted
  });

  it('should support Undo and Redo', () => {
    expect(service.canUndo()).toBe(false);

    const initialColor = service.getPixel(0, 0, 0);
    const newColor = initialColor === 5 ? 6 : 5;

    service.setPixel(0, 0, 0, newColor);
    expect(service.getPixel(0, 0, 0)).toBe(newColor);
    expect(service.canUndo()).toBe(true);

    service.undo();
    expect(service.getPixel(0, 0, 0)).toBe(initialColor);
    expect(service.canRedo()).toBe(true);

    service.redo();
    expect(service.getPixel(0, 0, 0)).toBe(newColor);
  });

  it('should shift sprite pixels correctly', () => {
    // Clear sprite 0
    service.clearSprite(0);
    service.setPixel(0, 4, 4, 7);

    // Shift right
    service.shiftSprite(0, 'right');
    expect(service.getPixel(0, 4, 4)).toBe(0);
    expect(service.getPixel(0, 5, 4)).toBe(7);

    // Shift down
    service.shiftSprite(0, 'down');
    expect(service.getPixel(0, 5, 4)).toBe(0);
    expect(service.getPixel(0, 5, 5)).toBe(7);
  });

  it('should flip sprite horizontally and vertically', () => {
    service.clearSprite(0);
    service.setPixel(0, 0, 0, 8); // Top-left pixel

    service.flipSprite(0, 'h');
    const width = service.sprites()[0].width;
    expect(service.getPixel(0, width - 1, 0)).toBe(8);
    expect(service.getPixel(0, 0, 0)).toBe(0);

    service.flipSprite(0, 'v');
    const height = service.sprites()[0].height;
    expect(service.getPixel(0, width - 1, height - 1)).toBe(8);
  });

  it('should add, duplicate, resize, and delete sprite entries', () => {
    const initialCount = service.sprites().length;

    // Add 8x8 sprite
    const newId = service.addSprite(8, 8, 'new_tile');
    expect(service.sprites().length).toBe(initialCount + 1);
    expect(service.sprites()[newId].width).toBe(8);
    expect(service.sprites()[newId].height).toBe(8);

    // Duplicate
    const dupId = service.duplicateSprite(newId);
    expect(service.sprites().length).toBe(initialCount + 2);
    expect(service.sprites()[dupId].name).toBe('new_tile_copy');

    // Resize
    service.resizeSprite(dupId, 24, 24);
    expect(service.sprites()[dupId].width).toBe(24);
    expect(service.sprites()[dupId].height).toBe(24);

    // Delete
    service.deleteSprite(dupId);
    expect(service.sprites().length).toBe(initialCount + 1);
  });

  it('should support creating and resizing custom non-square sprites in 8x8 cell increments (e.g. 3x2 = 24x16)', () => {
    // Add custom 3x2 cells (24x16) sprite
    const customId = service.addSprite(24, 16, 'custom_hero_3x2');
    const sprite = service.sprites()[customId];
    expect(sprite.width).toBe(24);
    expect(sprite.height).toBe(16);
    expect(sprite.pixelData.length).toBe((24 / 2) * 16); // 192 bytes

    // Draw on custom bounds
    service.setPixel(customId, 23, 15, 11);
    expect(service.getPixel(customId, 23, 15)).toBe(11);

    // Resize to 4x1 cells (32x8)
    service.resizeSprite(customId, 32, 8);
    const resized = service.sprites()[customId];
    expect(resized.width).toBe(32);
    expect(resized.height).toBe(8);
    expect(resized.pixelData.length).toBe((32 / 2) * 8); // 128 bytes
  });

  it('should correctly export and import binary .SPR files matching SPRITE-BANK.md specification', async () => {
    // Set custom pixel data
    service.setPixel(0, 1, 1, 12);
    service.setPixel(0, 2, 2, 7);

    // Export .SPR binary blob
    const blob = service.exportSprBinaryBlob(true);
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Verify 6-byte magic header 'RASPRT'
    expect(bytes[0]).toBe(TAG_HEADER_MAGIC[0]); // 'R'
    expect(bytes[1]).toBe(TAG_HEADER_MAGIC[1]); // 'A'
    expect(bytes[2]).toBe(TAG_HEADER_MAGIC[2]); // 'S'
    expect(bytes[3]).toBe(TAG_HEADER_MAGIC[3]); // 'P'
    expect(bytes[4]).toBe(TAG_HEADER_MAGIC[4]); // 'R'
    expect(bytes[5]).toBe(TAG_HEADER_MAGIC[5]); // 'T'

    // Verify roundtrip parsing in a new service instance
    const freshService = new SpriteService();
    const loadSuccess = freshService.loadSprBinary(arrayBuffer);
    expect(loadSuccess).toBe(true);

    expect(freshService.sprites().length).toBe(service.sprites().length);
    expect(freshService.getPixel(0, 1, 1)).toBe(12);
    expect(freshService.getPixel(0, 2, 2)).toBe(7);
  });

  it('should generate valid TypeScript, C++, and Forth source code', () => {
    const tsCode = service.exportTsSource('test_bank');
    expect(tsCode).toContain('export const TEST_BANK_NAME = \'test_bank\';');
    expect(tsCode).toContain('export const TEST_BANK_PALETTE');
    expect(tsCode).toContain('export const TEST_BANK_PIXEL_DATA');
    expect(tsCode).toContain('export function getTestBankPixel');

    const cppCode = service.exportCppSource('test_bank');
    expect(cppCode.h).toContain('TSpriteBank SpriteBank_TestBank;');
    expect(cppCode.cpp).toContain('static const uint32_t sprite_palette[16]');
    expect(cppCode.cpp).toContain('static const TSpriteEntry sprite_entries');

    const forthCode = service.exportForthSource('test_bank');
    expect(forthCode).toContain('CREATE TEST-BANK-PALETTE');
    expect(forthCode).toContain('CREATE TEST-BANK-ENTRIES');
  });
});
