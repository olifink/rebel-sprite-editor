import { SpriteEntry } from './sprite.model';

/** Helper to generate 4bpp pixel data from a multi-line string with hex characters (0..F) */
export function create4bppFromPattern(pattern: string[]): Uint8Array {
  const height = pattern.length;
  const width = pattern[0].length;
  const bytesPerRow = Math.ceil(width / 2);
  const data = new Uint8Array(bytesPerRow * height);

  for (let y = 0; y < height; y++) {
    const rowStr = pattern[y];
    for (let x = 0; x < width; x += 2) {
      const char0 = rowStr[x] || '0';
      const char1 = rowStr[x + 1] || '0';
      const nibble0 = parseInt(char0, 16) || 0;
      const nibble1 = parseInt(char1, 16) || 0;
      data[y * bytesPerRow + (x >> 1)] = ((nibble0 & 0x0f) << 4) | (nibble1 & 0x0f);
    }
  }
  return data;
}

/** Preset 1: Rebel Rogue (Dungeon crawler sprites and tiles) */
export function getRebelRoguePreset(): { name: string; paletteId: string; sprites: SpriteEntry[] } {
  const sprites: SpriteEntry[] = [
    // 0: Hero Idle 1 (16x16)
    {
      id: 0,
      name: 'hero_idle_0',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000004444000000',
        '0000044444400000',
        '0000444444440000',
        '00004FFFFF440000',
        '00004F1FF1F40000',
        '00004FFFFFF40000',
        '000004F44F400000',
        '0000004444000000',
        '0000088888800000',
        '0000889999880000',
        '0008889999888000',
        '0000888888880000',
        '0000080000800000',
        '0000080000800000',
        '00000E0000E00000',
        '0000EE0000EE0000'
      ])
    },
    // 1: Hero Idle 2 (16x16)
    {
      id: 1,
      name: 'hero_idle_1',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000004444000000',
        '0000044444400000',
        '0000444444440000',
        '00004FFFFF440000',
        '00004F1FF1F40000',
        '00004FFFFFF40000',
        '000004F44F400000',
        '0000088888800000',
        '0000889999880000',
        '0008889999888000',
        '0000888888880000',
        '0000080000800000',
        '0000080000800000',
        '00000E0000E00000',
        '0000EE0000EE0000',
        '0000000000000000'
      ])
    },
    // 2: Hero Walk 1 (16x16)
    {
      id: 2,
      name: 'hero_walk_0',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000004444000000',
        '0000044444400000',
        '0000444444440000',
        '00004FFFFF440000',
        '00004F1FF1F40000',
        '00004FFFFFF40000',
        '000004F44F400000',
        '0000004444000000',
        '0000088888800000',
        '0008889999880000',
        '0000889999888000',
        '0000888888880000',
        '0000088000000000',
        '0000008800800000',
        '000000EE00E00000',
        '0000000EE0EE0000'
      ])
    },
    // 3: Hero Walk 2 (16x16)
    {
      id: 3,
      name: 'hero_walk_1',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000004444000000',
        '0000044444400000',
        '0000444444440000',
        '00004FFFFF440000',
        '00004F1FF1F40000',
        '00004FFFFFF40000',
        '000004F44F400000',
        '0000004444000000',
        '0000088888800000',
        '0000889999888000',
        '0008889999880000',
        '0000888888880000',
        '0000000008800000',
        '0000080088000000',
        '00000E00EE000000',
        '0000EE0EE0000000'
      ])
    },
    // 4: Goblin Monster (16x16)
    {
      id: 4,
      name: 'monster_goblin',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000005555000000',
        '0005555555550000',
        '0555666666555000',
        '0556666666655000',
        '0006626626600000',
        '0006666666600000',
        '00006E66E6000000',
        '0000066660000000',
        '0000444444000000',
        '0004444444400000',
        '0044444444440000',
        '0000444444000000',
        '0000550055000000',
        '0000550055000000',
        '0005550055500000',
        '0000000000000000'
      ])
    },
    // 5: Skeleton (16x16)
    {
      id: 5,
      name: 'monster_skeleton',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000077777700000',
        '0000777777770000',
        '0007777777777000',
        '0007707777077000',
        '0007777007777000',
        '0000770000770000',
        '0000077777700000',
        '0000007007000000',
        '0000077777700000',
        '0007770770777000',
        '0007700770077000',
        '0000007777000000',
        '0000007007000000',
        '0000077007700000',
        '0000077007700000',
        '0000777007770000'
      ])
    },
    // 6: Dragon Boss (16x16)
    {
      id: 6,
      name: 'boss_dragon',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0022000000002200',
        '0222200000022220',
        '2222222222222222',
        '2222222222222222',
        '022FE22222EFE220',
        '002FE22222EFE200',
        '002222EEE2222200',
        '000222EEE2220000',
        '0002222222220000',
        '00222AAAA2222000',
        '02222AAAA2222200',
        '22222AAAA2222220',
        '00222AAAA2222000',
        '0002200002200000',
        '0002200002200000',
        '0022200002220000'
      ])
    },
    // 7: Sword (16x16)
    {
      id: 7,
      name: 'item_sword',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000000000000770',
        '0000000000007F70',
        '000000000007F700',
        '00000000007F7000',
        '0000000007F70000',
        '000000007F700000',
        '00000007F7000000',
        '0000007F70000000',
        '000007F700000000',
        '00007F7000000000',
        '000EEEE000000000',
        '00EE000EE0000000',
        '0000044000000000',
        '0000440000000000',
        '000EE00000000000',
        '0000000000000000'
      ])
    },
    // 8: Shield (16x16)
    {
      id: 8,
      name: 'item_shield',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000000000000000',
        '00EEEEEEEEEEEE00',
        '0EEEEEEEEEEEEEE0',
        '0EE9999999999EE0',
        '0EE9999EE9999EE0',
        '0EE9999EE9999EE0',
        '0EE9999EE9999EE0',
        '0EE99EEEEEE99EE0',
        '0EE99EEEEEE99EE0',
        '00EE999EE999EE00',
        '00EE999EE999EE00',
        '000EE99EE99EE000',
        '0000EE9EE9EE0000',
        '00000EEEEEE00000',
        '000000EEEE000000',
        '0000000EE0000000'
      ])
    },
    // 9: Red Potion (8x8)
    {
      id: 9,
      name: 'item_potion',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '00044000',
        '00077000',
        '007FF700',
        '07F22F70',
        '7F2222F7',
        '7F2222F7',
        '7F2222F7',
        '07FFFF70'
      ])
    },
    // 10: Gold Coin (8x8)
    {
      id: 10,
      name: 'item_coin',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '00EEEE00',
        '0EEFFEE0',
        'EEFFFFEE',
        'EEFEFFEE',
        'EEFEFFEE',
        'EEFFFFEE',
        '0EEFFEE0',
        '00EEEE00'
      ])
    },
    // 11: Dungeon Key (8x8)
    {
      id: 11,
      name: 'item_key',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '00EEE000',
        '0E000E00',
        '00EEE000',
        '000E0000',
        '000EEE00',
        '000E0000',
        '000EEE00',
        '00000000'
      ])
    },
    // 12: Dungeon Wall Tile (8x8)
    {
      id: 12,
      name: 'tile_wall',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '77737773',
        '7F737F73',
        '33333333',
        '77377773',
        '7F37F7F3',
        '33333333',
        '77773773',
        '7F7F37F3'
      ])
    },
    // 13: Dungeon Floor Tile (8x8)
    {
      id: 13,
      name: 'tile_floor',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '33333338',
        '38333338',
        '33333338',
        '33333838',
        '33333338',
        '38333338',
        '33333338',
        '88888888'
      ])
    },
    // 14: Dungeon Closed Door (8x8)
    {
      id: 14,
      name: 'tile_door_closed',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '77777777',
        '74444447',
        '744E4447',
        '74444447',
        '74444447',
        '744E4447',
        '74444447',
        '77777777'
      ])
    },
    // 15: Treasure Chest (8x8)
    {
      id: 15,
      name: 'tile_chest',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '00444400',
        '04EEEE40',
        '4E4444E4',
        '4EEEEEE4',
        '444EE444',
        '4EEEEEE4',
        '44444444',
        '00000000'
      ])
    }
  ];

  return {
    name: 'rebel_rogue',
    paletteId: 'sweetie16',
    sprites
  };
}

/** Preset 2: Retro Platformer */
export function getRetroPlatformerPreset(): { name: string; paletteId: string; sprites: SpriteEntry[] } {
  const sprites: SpriteEntry[] = [
    // 0: Player Idle (16x16)
    {
      id: 0,
      name: 'player_idle',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000008888000000',
        '0000088888800000',
        '0000888888880000',
        '00008FFFFFF80000',
        '00008F0FF0F80000',
        '00008FFFFFF80000',
        '000008F88F800000',
        '0000008888000000',
        '00000CCCCCCC0000',
        '0000CCCCCCCCC000',
        '000CCCCCCCCCC000',
        '00000CCCCCC00000',
        '00000C0000C00000',
        '00000C0000C00000',
        '00000A0000A00000',
        '0000AA0000AA0000'
      ])
    },
    // 1: Player Jump (16x16)
    {
      id: 1,
      name: 'player_jump',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000008888000000',
        '0000088888800000',
        '0000888888880000',
        '00008FFFFFF80000',
        '00008F0FF0F80000',
        '00008FFFFFF80000',
        '000008F88F800000',
        '0000CCCCCCCC0000',
        '00CCCCCCCCCCCC00',
        '0CCCCCCCCCCCCCC0',
        '00000CCCCCC00000',
        '0000AA0000AA0000',
        '000AAA0000AAA000',
        '0000000000000000',
        '0000000000000000',
        '0000000000000000'
      ])
    },
    // 2: Slime Monster (16x16)
    {
      id: 2,
      name: 'enemy_slime',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000000000000000',
        '0000000BB0000000',
        '000000BBBB000000',
        '00000BBBBBB00000',
        '0000BBBBBBBB0000',
        '000BBBBBBBBBB000',
        '00BBBBBBBBBBBB00',
        '0BB00BBBB00BB00',
        '0BB07BBBB07BB00',
        '0BBBBBBBBBBBBB00',
        '0BBBBBBBBBBBBB00',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        '0BBBBBBBBBBBBBB0',
        '0000000000000000'
      ])
    },
    // 3: Grass Block (16x16)
    {
      id: 3,
      name: 'tile_grass_block',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        '3B33BB333BB33B3B',
        '3333333333333333',
        '4444444444444444',
        '4445444445444444',
        '4444444444444444',
        '4544444544444454',
        '4444444444444444',
        '4444544444454444',
        '4444444444444444',
        '4454444454444444',
        '4444444444444444',
        '4444454444445444',
        '4444444444444444',
        '4444444444444444'
      ])
    },
    // 4: Mystery Question Block (16x16)
    {
      id: 4,
      name: 'tile_question_block',
      width: 16,
      height: 16,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        'AAAAAAAAAAAAAAAA',
        'AFFFFFFFFFFFFFF9',
        'AF999999999999F9',
        'AF999AAAAAA999F9',
        'AF99AA9999AA99F9',
        'AF99999999AA99F9',
        'AF9999999AA999F9',
        'AF999999AA9999F9',
        'AF999999AA9999F9',
        'AF999999999999F9',
        'AF999999AA9999F9',
        'AF999999AA9999F9',
        'AF999999999999F9',
        'AF999999999999F9',
        'AFFFFFFFFFFFFFF9',
        '9999999999999999'
      ])
    }
  ];

  return {
    name: 'retro_platformer',
    paletteId: 'pico8',
    sprites
  };
}

/** Preset 3: UI Tileset */
export function getUiTilesetPreset(): { name: string; paletteId: string; sprites: SpriteEntry[] } {
  const sprites: SpriteEntry[] = [
    // 0: Window Corner TL (8x8)
    {
      id: 0,
      name: 'ui_corner_tl',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '00FFFFFF',
        '0FFFFFFF',
        'FFFFFF11',
        'FFFFF111',
        'FFFF1111',
        'FFF11111',
        'FF111111',
        'FF111111'
      ])
    },
    // 1: Window Border Top (8x8)
    {
      id: 1,
      name: 'ui_border_top',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        'FFFFFFFF',
        'FFFFFFFF',
        '11111111',
        '11111111',
        '11111111',
        '11111111',
        '11111111',
        '11111111'
      ])
    },
    // 2: Window Corner TR (8x8)
    {
      id: 2,
      name: 'ui_corner_tr',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        'FFFFFF00',
        'FFFFFFF0',
        '11FFFFFF',
        '111FFFFF',
        '1111FFFF',
        '11111FFF',
        '111111FF',
        '111111FF'
      ])
    },
    // 3: Heart Icon (8x8)
    {
      id: 3,
      name: 'icon_heart',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '02200220',
        '2FFA2FFA',
        '2FFA2FFA',
        '2AAAAAAA',
        '02AAAAA0',
        '002AAA00',
        '0002A000',
        '00000000'
      ])
    },
    // 4: Mana Crystal Icon (8x8)
    {
      id: 4,
      name: 'icon_mana',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '00099000',
        '009DD900',
        '09DFFD90',
        '9DFFFFD9',
        '09DFFD90',
        '009DD900',
        '00099000',
        '00000000'
      ])
    },
    // 5: Checkmark Icon (8x8)
    {
      id: 5,
      name: 'icon_check',
      width: 8,
      height: 8,
      hFlip: false,
      vFlip: false,
      modified: false,
      isEmpty: false,
      pixelData: create4bppFromPattern([
        '0000000C',
        '000000CC',
        '00000CC0',
        'C000CC00',
        'CC0CC000',
        '0CCCC000',
        '00CC0000',
        '00000000'
      ])
    }
  ];

  return {
    name: 'ui_tileset',
    paletteId: 'zxspectrum',
    sprites
  };
}
