import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { SpriteService } from '../../services/sprite.service';
import { PwaService } from '../../services/pwa.service';
import { getRebelRoguePreset, getRetroPlatformerPreset, getUiTilesetPreset } from '../../models/presets.data';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-toolbar class="app-toolbar m3-surface-container">
      <div class="brand-section">
        <div class="brand-logo">
          <span class="material-symbols-outlined logo-icon">auto_awesome_motion</span>
        </div>
        <div class="brand-titles">
          <h1 class="app-title">REBEL<span class="accent-text">SPRITE</span></h1>
          <span class="app-subtitle">4bpp Sprite & Tile Sheet Forge</span>
        </div>
      </div>

      <div class="toolbar-center">
        <div class="bank-name-field">
          <label for="bank-name-input" class="field-label">BANK</label>
          <input
            id="bank-name-input"
            type="text"
            [ngModel]="spriteService.bankName()"
            (ngModelChange)="spriteService.bankName.set($event)"
            placeholder="rebel_rogue"
            class="bank-name-input"
          />
          <span class="memory-tag">{{ spriteService.formattedMemorySize() }}</span>
        </div>
      </div>

      <div class="toolbar-actions">
        <!-- Undo / Redo -->
        <button
          mat-icon-button
          (click)="spriteService.undo()"
          [disabled]="!spriteService.canUndo()"
          matTooltip="Undo (Ctrl+Z)"
        >
          <span class="material-symbols-outlined">undo</span>
        </button>

        <button
          mat-icon-button
          (click)="spriteService.redo()"
          [disabled]="!spriteService.canRedo()"
          matTooltip="Redo (Ctrl+Y / Ctrl+Shift+Z)"
        >
          <span class="material-symbols-outlined">redo</span>
        </button>

        <div class="v-divider"></div>

        <!-- Load Binary .SPR -->
        <button
          mat-stroked-button
          class="m3-button-secondary"
          (click)="fileInput.click()"
          matTooltip="Load binary .SPR sprite bank file"
        >
          <span class="material-symbols-outlined">file_open</span>
          <span>Load .SPR</span>
        </button>
        <input
          #fileInput
          type="file"
          accept=".spr,.SPR,.bin,application/octet-stream"
          style="display: none"
          (change)="onFileSelected($event)"
        />
        <input
          #mergeFileInput
          type="file"
          accept=".spr,.SPR,.bin,application/octet-stream"
          style="display: none"
          (change)="onMergeFileSelected($event)"
        />

        <!-- Save Binary .SPR -->
        <button
          mat-flat-button
          color="primary"
          class="m3-button-primary"
          (click)="downloadSpr()"
          matTooltip="Download binary .SPR file with 6-byte 'RASPRT' tag header"
        >
          <span class="material-symbols-outlined">download</span>
          <span>Save .SPR</span>
        </button>

        <!-- Export Code Dialog -->
        <button
          mat-stroked-button
          class="m3-button-accent"
          (click)="openExport.emit()"
          matTooltip="Generate TypeScript, C++, Forth, or PNG spritesheet"
        >
          <span class="material-symbols-outlined">code</span>
          <span>Export Code</span>
        </button>

        <!-- Presets & Utilities Menu -->
        <button
          mat-icon-button
          [matMenuTriggerFor]="presetsMenu"
          matTooltip="Presets & Utilities"
        >
          <span class="material-symbols-outlined">more_vert</span>
        </button>

        <mat-menu #presetsMenu="matMenu" class="m3-menu">
          <button mat-menu-item (click)="mergeFileInput.click()">
            <span class="material-symbols-outlined">call_merge</span>
            <span>Merge .SPR (Overlay non-empty sprites)</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="loadPreset('rogue')">
            <span class="material-symbols-outlined">swords</span>
            <span>Preset: Rebel Rogue (Dungeon Heroes & Tiles)</span>
          </button>
          <button mat-menu-item (click)="loadPreset('platformer')">
            <span class="material-symbols-outlined">sports_esports</span>
            <span>Preset: Retro Platformer</span>
          </button>
          <button mat-menu-item (click)="loadPreset('ui')">
            <span class="material-symbols-outlined">dashboard_customize</span>
            <span>Preset: UI Tileset & Icons</span>
          </button>
          <mat-divider></mat-divider>
          <button mat-menu-item (click)="spriteService.clearAllSprites()">
            <span class="material-symbols-outlined">delete_sweep</span>
            <span>Clear All (Blank Bank)</span>
          </button>
        </mat-menu>

        <!-- PWA Install -->
        <button
          *ngIf="pwaService.canInstall()"
          mat-icon-button
          color="accent"
          (click)="pwaService.promptInstall()"
          matTooltip="Install Rebel Sprite Editor PWA"
        >
          <span class="material-symbols-outlined">install_desktop</span>
        </button>

        <!-- Theme Toggle -->
        <button
          mat-icon-button
          (click)="toggleTheme.emit()"
          [matTooltip]="isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'"
        >
          <span class="material-symbols-outlined">
            {{ isDarkMode ? 'light_mode' : 'dark_mode' }}
          </span>
        </button>

        <!-- Network / Offline Badge -->
        <div class="status-chip" [class.offline]="!pwaService.isOnline()">
          <span class="status-dot"></span>
          <span>{{ pwaService.isOnline() ? 'PWA Ready' : 'Offline' }}</span>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .app-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      height: 64px;
      background: var(--sys-surface-container);
      border-bottom: 1px solid var(--sys-outline-variant);
      box-shadow: 0 2px 12px rgba(0,0,0,0.12);
      z-index: 10;
    }

    .brand-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--sys-primary);
      color: var(--sys-on-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0, 188, 212, 0.3);
    }

    .logo-icon {
      font-size: 24px;
    }

    .brand-titles {
      display: flex;
      flex-direction: column;
    }

    .app-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: 1px;
      margin: 0;
      line-height: 1.1;
      color: #ffffff;
    }

    .accent-text {
      color: var(--sys-primary);
    }

    .app-subtitle {
      font-size: 0.72rem;
      color: var(--sys-on-surface-variant);
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
    }

    .bank-name-field {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--sys-surface-container-high);
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px solid var(--sys-outline-variant);
    }

    .field-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--sys-primary);
      letter-spacing: 1px;
    }

    .bank-name-input {
      background: transparent;
      border: none;
      color: var(--sys-on-surface);
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      font-weight: 600;
      outline: none;
      width: 140px;
    }

    .memory-tag {
      font-family: 'Fira Code', monospace;
      font-size: 0.7rem;
      color: var(--sys-on-surface-variant);
      background: var(--sys-surface-container);
      padding: 2px 8px;
      border-radius: 10px;
      border: 1px solid var(--sys-outline-variant);
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .v-divider {
      width: 1px;
      height: 24px;
      background: var(--sys-outline-variant);
      margin: 0 4px;
    }

    .m3-button-primary {
      border-radius: 20px !important;
      font-weight: 600 !important;
    }

    .m3-button-secondary {
      border-radius: 20px !important;
      font-weight: 600 !important;
      color: #ffffff !important;
      border-color: var(--sys-outline, #899294) !important;
      background: var(--sys-surface-container-high) !important;

      .material-symbols-outlined {
        color: #ffffff !important;
      }

      &:hover {
        background: var(--sys-surface-container-highest) !important;
        border-color: var(--sys-primary) !important;
      }
    }

    .m3-button-accent {
      border-radius: 20px !important;
      font-weight: 600 !important;
      color: #ffffff !important;
      border-color: var(--sys-primary) !important;
      background: var(--sys-surface-container-high) !important;

      .material-symbols-outlined {
        color: var(--sys-primary) !important;
      }

      &:hover {
        background: var(--sys-primary-container) !important;
        color: #ffffff !important;
      }
    }

    :host-context(body.light-theme) {
      .app-title {
        color: #171c1e;
      }

      .m3-button-secondary {
        color: #171c1e !important;
        border-color: var(--sys-outline) !important;
        background: var(--sys-surface-container-high) !important;

        .material-symbols-outlined {
          color: #171c1e !important;
        }
      }

      .m3-button-accent {
        color: #006875 !important;
        border-color: var(--sys-primary) !important;
        background: var(--sys-surface-container-high) !important;

        .material-symbols-outlined {
          color: #006875 !important;
        }
      }
    }

    .status-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      background: rgba(76, 175, 80, 0.15);
      color: #4caf50;
      border: 1px solid rgba(76, 175, 80, 0.3);

      &.offline {
        background: rgba(255, 152, 0, 0.15);
        color: #ff9800;
        border-color: rgba(255, 152, 0, 0.3);

        .status-dot {
          background-color: #ff9800;
        }
      }
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: #4caf50;
    }
  `]
})
export class HeaderComponent {
  spriteService = inject(SpriteService);
  pwaService = inject(PwaService);

  @Output() openExport = new EventEmitter<void>();
  @Output() toggleTheme = new EventEmitter<void>();
  @Output() fileLoaded = new EventEmitter<string>();
  isDarkMode = true;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as ArrayBuffer;
      if (result) {
        const success = this.spriteService.loadSprBinary(result);
        if (success) {
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          this.spriteService.bankName.set(fileNameWithoutExt);
          this.fileLoaded.emit(`Successfully loaded ${file.name} (${result.byteLength} bytes, ${this.spriteService.totalSprites()} sprites)`);
        } else {
          this.fileLoaded.emit(`Failed to parse binary file ${file.name}`);
        }
      }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  }

  onMergeFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const result = e.target?.result as ArrayBuffer;
      if (result) {
        const mergedCount = this.spriteService.mergeSprBinary(result);
        this.fileLoaded.emit(`Merged ${mergedCount} non-empty sprite(s) from ${file.name}`);
      }
    };
    reader.readAsArrayBuffer(file);
    input.value = '';
  }

  loadPreset(type: 'rogue' | 'platformer' | 'ui') {
    if (type === 'rogue') {
      const p = getRebelRoguePreset();
      this.spriteService.loadPresetData(p.name, p.paletteId, p.sprites);
      this.fileLoaded.emit('Loaded Rebel Rogue preset bank');
    } else if (type === 'platformer') {
      const p = getRetroPlatformerPreset();
      this.spriteService.loadPresetData(p.name, p.paletteId, p.sprites);
      this.fileLoaded.emit('Loaded Retro Platformer preset bank');
    } else if (type === 'ui') {
      const p = getUiTilesetPreset();
      this.spriteService.loadPresetData(p.name, p.paletteId, p.sprites);
      this.fileLoaded.emit('Loaded UI Tileset preset bank');
    }
  }

  downloadSpr() {
    const blob = this.spriteService.exportSprBinaryBlob(true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = (this.spriteService.bankName() || 'sprites').toLowerCase().replace(/[^a-z0-9_]/g, '_');
    a.href = url;
    a.download = `${name}.SPR`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
