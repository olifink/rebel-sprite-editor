#ifndef SPRITE_BANK_REBEL_ROGUE_H
#define SPRITE_BANK_REBEL_ROGUE_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    uint8_t width;
    uint8_t height;
    uint8_t flags; // bit 0 = H-FLIP, bit 1 = V-FLIP
    uint8_t reserved;
} TSpriteEntry;

typedef struct {
    const char* name;
    uint16_t entry_count;
    const uint32_t* palette;
    const TSpriteEntry* entries;
    const uint8_t* pixel_data;
} TSpriteBank;

extern const TSpriteBank SpriteBank_RebelRogue;

#ifdef __cplusplus
}
#endif

#endif // SPRITE_BANK_REBEL_ROGUE_H
