import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SpriteService } from '../../services/sprite.service';
import { PALETTE_PRESETS, PaletteColor } from '../../models/sprite.model';

@Component({
  selector: 'app-palette-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <div class="palette-bar-container">
      <div class="palette-header">
        <div class="header-left">
          <span class="material-symbols-outlined header-icon">palette</span>
          <span class="palette-title">16-COLOR PALETTE</span>
          <span class="active-color-info">
            [#{{ activeColor().index }}]
            <span class="hex-badge">{{ activeColor().hex }}</span>
            <span *ngIf="activeColor().isTransparent" class="trans-badge">Transparent / Color-Key</span>
          </span>
        </div>

        <div class="header-right">
          <!-- Color Picker Input for currently selected palette index -->
          <label class="color-picker-label" matTooltip="Edit Color Hex">
            <span class="material-symbols-outlined">colorize</span>
            <span>Edit RGB</span>
            <input
              type="color"
              [value]="activeColor().hex"
              (change)="onColorPickerChange($event)"
              class="hidden-color-input"
            />
          </label>

          <!-- Palette Presets Menu -->
          <button
            mat-stroked-button
            class="preset-dropdown-btn"
            [matMenuTriggerFor]="palPresetMenu"
            matTooltip="Choose standard 16-color palette preset"
          >
            <span class="material-symbols-outlined">tune</span>
            <span>{{ currentPresetName() }}</span>
            <span class="material-symbols-outlined">arrow_drop_down</span>
          </button>

          <mat-menu #palPresetMenu="matMenu" class="m3-menu">
            <button
              *ngFor="let preset of presets"
              mat-menu-item
              (click)="spriteService.setPalettePreset(preset.id)"
            >
              <div class="preset-menu-item">
                <span class="preset-name">{{ preset.name }}</span>
                <div class="preset-mini-preview">
                  <span
                    *ngFor="let c of preset.colors.slice(0, 8)"
                    class="mini-swatch"
                    [style.background]="c"
                  ></span>
                </div>
              </div>
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- 16 Color Swatches -->
      <div class="swatches-grid">
        <div
          *ngFor="let color of spriteService.palette(); let i = index"
          class="swatch-item"
          [class.selected-primary]="spriteService.selectedColorIndex() === i"
          [class.is-transparent]="color.isTransparent"
          (click)="selectPrimaryColor(i)"
          (contextmenu)="selectSecondaryColor($event, i)"
          [matTooltip]="'[' + i + '] ' + color.hex + (color.isTransparent ? ' (Transparent/Key)' : '') + ' (Right-click: Secondary)'"
        >
          <div class="swatch-color" [style.background]="color.hex">
            <span *ngIf="color.isTransparent" class="trans-indicator">T</span>
          </div>
          <span class="swatch-index">{{ i }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .palette-bar-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: var(--sys-surface-container-high);
      border-radius: 12px;
      padding: 8px 12px;
      border: 1px solid var(--sys-outline-variant);
    }

    .palette-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icon {
      color: var(--sys-primary);
      font-size: 18px;
    }

    .palette-title {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: var(--sys-on-surface);
    }

    .active-color-info {
      font-family: 'Fira Code', monospace;
      font-size: 0.72rem;
      color: var(--sys-on-surface-variant);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .hex-badge {
      background: var(--sys-surface-container);
      padding: 1px 6px;
      border-radius: 4px;
      color: var(--sys-primary);
      font-weight: 600;
    }

    .trans-badge {
      font-size: 0.62rem;
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 700;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .color-picker-label {
      position: relative;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--sys-on-surface);
      background: var(--sys-surface-container);
      border: 1px solid var(--sys-outline-variant);
      padding: 3px 8px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 14px;
        color: var(--sys-primary);
      }

      &:hover {
        background: var(--sys-surface-container-highest);
        border-color: var(--sys-primary);
      }
    }

    .hidden-color-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
      pointer-events: none;
    }

    .preset-dropdown-btn {
      height: 28px !important;
      border-radius: 8px !important;
      padding: 0 8px !important;
      font-size: 0.7rem !important;
      font-weight: 600 !important;

      .material-symbols-outlined {
        font-size: 16px !important;
      }
    }

    .swatches-grid {
      display: grid;
      grid-template-columns: repeat(16, minmax(18px, 1fr));
      gap: 4px;
    }

    .swatch-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      cursor: pointer;
      user-select: none;
      padding: 2px;
      border-radius: 6px;
      border: 2px solid transparent;
      transition: all 0.15s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &.selected-primary {
        border-color: var(--sys-primary);
        box-shadow: 0 0 8px rgba(0, 188, 212, 0.5);
        background: rgba(0, 188, 212, 0.15);
      }
    }

    .swatch-color {
      width: 100%;
      height: 22px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.3);
    }

    .is-transparent .swatch-color {
      background-image: linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
                        linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
                        linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
      background-size: 6px 6px;
      background-position: 0 0, 0 3px, 3px -3px, -3px 0px;
    }

    .trans-indicator {
      font-size: 0.6rem;
      font-weight: 900;
      color: #ff9800;
      text-shadow: 0 1px 2px #000;
    }

    .swatch-index {
      font-family: 'Fira Code', monospace;
      font-size: 0.55rem;
      font-weight: 700;
      color: var(--sys-on-surface-variant);
    }

    .preset-menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .preset-name {
      font-weight: 600;
      font-size: 0.8rem;
    }

    .preset-mini-preview {
      display: flex;
      gap: 2px;
    }

    .mini-swatch {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }
  `]
})
export class PaletteBarComponent {
  spriteService = inject(SpriteService);
  presets = PALETTE_PRESETS;

  activeColor(): PaletteColor {
    const pal = this.spriteService.palette();
    const idx = this.spriteService.selectedColorIndex();
    return pal[idx] || { index: 0, r: 0, g: 0, b: 0, hex: '#000000', u32: 0, isTransparent: true };
  }

  currentPresetName(): string {
    const presetId = this.spriteService.activePalettePresetId();
    const found = PALETTE_PRESETS.find(p => p.id === presetId);
    return found ? found.name : 'Custom Palette';
  }

  selectPrimaryColor(index: number) {
    this.spriteService.selectedColorIndex.set(index);
  }

  selectSecondaryColor(event: MouseEvent, index: number) {
    event.preventDefault();
    this.spriteService.secondaryColorIndex.set(index);
  }

  onColorPickerChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const hex = input.value;
    const idx = this.spriteService.selectedColorIndex();
    this.spriteService.setPaletteColor(idx, hex);
  }
}
