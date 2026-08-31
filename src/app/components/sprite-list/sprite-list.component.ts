import { Component, ElementRef, ViewChildren, QueryList, AfterViewInit, effect, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { SpriteService } from '../../services/sprite.service';
import { SpriteEntry } from '../../models/sprite.model';

@Component({
  selector: 'app-sprite-list',
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
    <div class="sprite-list-container m3-card">
      <div class="list-header">
        <div class="title-row">
          <span class="material-symbols-outlined header-icon">grid_view</span>
          <h2 class="section-title">Sprite Bank</h2>
          <span class="count-badge">{{ filteredSprites().length }} / {{ spriteService.totalSprites() }}</span>

          <button
            mat-flat-button
            color="primary"
            class="add-sprite-btn"
            [matMenuTriggerFor]="addMenu"
            matTooltip="Add New Sprite or Tile Entry"
          >
            <span class="material-symbols-outlined">add</span>
            <span>Add</span>
          </button>

          <mat-menu #addMenu="matMenu" class="m3-menu">
            <button mat-menu-item (click)="addNewSprite(8, 8, 'tile_8x8')">
              <span class="material-symbols-outlined">crop_square</span>
              <span>8 x 8 (1x1 cell - 32 B)</span>
            </button>
            <button mat-menu-item (click)="addNewSprite(16, 16, 'sprite_16x16')">
              <span class="material-symbols-outlined">grid_view</span>
              <span>16 x 16 (2x2 cells - 128 B)</span>
            </button>
            <button mat-menu-item (click)="addNewSprite(24, 16, 'sprite_24x16')">
              <span class="material-symbols-outlined">crop_landscape</span>
              <span>24 x 16 (3x2 cells - 192 B)</span>
            </button>
            <button mat-menu-item (click)="addNewSprite(24, 24, 'sprite_24x24')">
              <span class="material-symbols-outlined">grid_4x4</span>
              <span>24 x 24 (3x3 cells - 288 B)</span>
            </button>
            <button mat-menu-item (click)="addNewSprite(16, 32, 'sprite_16x32')">
              <span class="material-symbols-outlined">crop_portrait</span>
              <span>16 x 32 (2x4 cells - 256 B)</span>
            </button>
            <button mat-menu-item (click)="addNewSprite(32, 32, 'sprite_32x32')">
              <span class="material-symbols-outlined">window</span>
              <span>32 x 32 (4x4 cells - 512 B)</span>
            </button>
            <button mat-menu-item (click)="openCustomSizeModal()">
              <span class="material-symbols-outlined">aspect_ratio</span>
              <span>Custom Dimensions (NxM cells)...</span>
            </button>
          </mat-menu>
        </div>

        <!-- Search input -->
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            type="text"
            placeholder="Filter by name (hero), id (#0), size (16x16)..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            class="search-input"
          />
          <button
            *ngIf="searchQuery()"
            class="clear-search-btn"
            (click)="searchQuery.set('')"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Filter pills -->
        <div class="category-pills">
          <button
            class="pill-btn"
            [class.active]="activeCategory() === 'all'"
            (click)="activeCategory.set('all')"
          >
            All
          </button>
          <button
            class="pill-btn"
            [class.active]="activeCategory() === 'sprites'"
            (click)="activeCategory.set('sprites')"
          >
            Sprites (≥16px)
          </button>
          <button
            class="pill-btn"
            [class.active]="activeCategory() === 'tiles'"
            (click)="activeCategory.set('tiles')"
          >
            Tiles (8x8)
          </button>
          <button
            class="pill-btn"
            [class.active]="activeCategory() === 'non-empty'"
            (click)="activeCategory.set('non-empty')"
          >
            Non-Empty
          </button>
        </div>

        <!-- Batch Nudge & Flip Bar -->
        <div class="batch-bar">
          <span class="batch-label">BATCH ({{ filteredSprites().length }}):</span>
          <div class="batch-btn-group">
            <button
              class="batch-btn"
              (click)="nudgeVisible('up')"
              [disabled]="filteredSprites().length === 0"
              matTooltip="Nudge Up All Visible Sprites"
            >
              <span class="material-symbols-outlined">arrow_upward</span>
            </button>
            <button
              class="batch-btn"
              (click)="nudgeVisible('down')"
              [disabled]="filteredSprites().length === 0"
              matTooltip="Nudge Down All Visible Sprites"
            >
              <span class="material-symbols-outlined">arrow_downward</span>
            </button>
            <button
              class="batch-btn"
              (click)="nudgeVisible('left')"
              [disabled]="filteredSprites().length === 0"
              matTooltip="Nudge Left All Visible Sprites"
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <button
              class="batch-btn"
              (click)="nudgeVisible('right')"
              [disabled]="filteredSprites().length === 0"
              matTooltip="Nudge Right All Visible Sprites"
            >
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Sprite Grid View -->
      <div class="grid-content">
        <div
          *ngFor="let sprite of filteredSprites()"
          class="sprite-card"
          [class.selected]="sprite.id === spriteService.selectedSpriteIndex()"
          [class.modified]="sprite.modified"
          [class.is-empty]="sprite.isEmpty"
          (click)="spriteService.selectSprite(sprite.id)"
          [matTooltip]="'#' + sprite.id + ' ' + sprite.name + ' (' + sprite.width + 'x' + sprite.height + ')'"
        >
          <div class="card-top">
            <span class="id-badge">#{{ sprite.id }}</span>
            <div class="flags-group">
              <span class="flag-badge" *ngIf="sprite.hFlip" matTooltip="Horizontal Flip Active">H</span>
              <span class="flag-badge" *ngIf="sprite.vFlip" matTooltip="Vertical Flip Active">V</span>
              <span class="modified-dot" *ngIf="sprite.modified" matTooltip="Modified"></span>
            </div>
          </div>

          <div class="canvas-holder">
            <canvas
              #spriteCanvas
              [attr.data-id]="sprite.id"
              [width]="sprite.width"
              [height]="sprite.height"
              class="cell-canvas"
            ></canvas>
          </div>

          <div class="card-bottom">
            <span class="name-label">{{ sprite.name }}</span>
            <span class="dim-badge">{{ sprite.width / 8 }}x{{ sprite.height / 8 }}c</span>
          </div>

          <!-- Quick card action overlay -->
          <div class="card-actions" (click)="$event.stopPropagation()">
            <button
              class="mini-action-btn"
              (click)="spriteService.duplicateSprite(sprite.id)"
              matTooltip="Duplicate Sprite"
            >
              <span class="material-symbols-outlined">content_copy</span>
            </button>
            <button
              class="mini-action-btn"
              *ngIf="spriteService.totalSprites() > 1"
              (click)="spriteService.deleteSprite(sprite.id)"
              matTooltip="Delete Sprite"
            >
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <div *ngIf="filteredSprites().length === 0" class="no-results">
          <span class="material-symbols-outlined empty-icon">search_off</span>
          <span>No sprites match your filter</span>
        </div>
      </div>

      <!-- Custom Dimensions Creator Modal -->
      <div *ngIf="showCustomModal()" class="custom-modal-backdrop" (click)="showCustomModal.set(false)">
        <div class="custom-modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-group">
              <span class="material-symbols-outlined modal-icon">aspect_ratio</span>
              <h3 class="modal-title">Custom Sprite Dimensions</h3>
            </div>
            <button class="close-modal-btn" (click)="showCustomModal.set(false)">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <p class="modal-description">
            Specify width and height in 8x8 character cell units (1 to 8 cells each).
          </p>

          <div class="modal-inputs-grid">
            <div class="modal-field">
              <label class="field-label">Width (8x8 cells):</label>
              <div class="cell-spinner">
                <button class="spin-btn" [disabled]="customWCells() <= 1" (click)="customWCells.set(customWCells() - 1)">-</button>
                <span class="spin-val">{{ customWCells() }} cells ({{ customWCells() * 8 }}px)</span>
                <button class="spin-btn" [disabled]="customWCells() >= 8" (click)="customWCells.set(customWCells() + 1)">+</button>
              </div>
            </div>

            <div class="modal-field">
              <label class="field-label">Height (8x8 cells):</label>
              <div class="cell-spinner">
                <button class="spin-btn" [disabled]="customHCells() <= 1" (click)="customHCells.set(customHCells() - 1)">-</button>
                <span class="spin-val">{{ customHCells() }} cells ({{ customHCells() * 8 }}px)</span>
                <button class="spin-btn" [disabled]="customHCells() >= 8" (click)="customHCells.set(customHCells() + 1)">+</button>
              </div>
            </div>
          </div>

          <!-- Live Wireframe Cell Grid Preview -->
          <div class="modal-preview-box">
            <div
              class="cells-preview-grid"
              [style.gridTemplateColumns]="'repeat(' + customWCells() + ', 22px)'"
              [style.gridTemplateRows]="'repeat(' + customHCells() + ', 22px)'"
            >
              <div *ngFor="let i of getCellArray(customWCells() * customHCells())" class="cell-preview-block"></div>
            </div>
            <div class="preview-meta">
              <span class="preview-tag">{{ customWCells() }}✕{{ customHCells() }} cells</span>
              <span class="preview-dim">{{ customWCells() * 8 }} ✕ {{ customHCells() * 8 }} px</span>
              <span class="preview-bytes">{{ (customWCells() * 8 / 2) * (customHCells() * 8) }} bytes (4bpp)</span>
            </div>
          </div>

          <div class="modal-field">
            <label class="field-label">Sprite Name:</label>
            <input
              type="text"
              class="modal-text-input"
              [ngModel]="customName()"
              (ngModelChange)="customName.set($event)"
              placeholder="e.g. sprite_3x2"
            />
          </div>

          <div class="modal-actions">
            <button class="modal-cancel-btn" (click)="showCustomModal.set(false)">Cancel</button>
            <button class="modal-create-btn" (click)="createCustomSprite()">
              <span class="material-symbols-outlined">add</span>
              <span>Create Sprite</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sprite-list-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--sys-surface-container);
      border-radius: 16px;
      border: 1px solid var(--sys-outline-variant);
      overflow: hidden;
    }

    .list-header {
      padding: 12px 14px;
      border-bottom: 1px solid var(--sys-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-icon {
      color: var(--sys-primary);
      font-size: 20px;
    }

    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      margin: 0;
      flex: 1;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .count-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 8px;
      background: var(--sys-surface-container-highest);
      color: var(--sys-on-surface-variant);
      border-radius: 10px;
    }

    .add-sprite-btn {
      border-radius: 14px !important;
      height: 28px !important;
      padding: 0 10px !important;
      font-size: 0.75rem !important;
      font-weight: 700 !important;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: var(--sys-surface-container-high);
      border-radius: 12px;
      padding: 4px 10px;
      border: 1px solid var(--sys-outline-variant);

      &:focus-within {
        border-color: var(--sys-primary);
      }
    }

    .search-icon {
      font-size: 18px;
      color: var(--sys-on-surface-variant);
      margin-right: 6px;
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--sys-on-surface);
      font-size: 0.78rem;
      width: 100%;
      outline: none;

      &::placeholder {
        color: var(--sys-on-surface-variant);
        opacity: 0.7;
      }
    }

    .clear-search-btn {
      background: transparent;
      border: none;
      color: var(--sys-on-surface-variant);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 0;

      .material-symbols-outlined {
        font-size: 16px;
      }
    }

    .category-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
    }

    .pill-btn {
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface-variant);
      border-radius: 14px;
      padding: 2px 8px;
      font-size: 0.68rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--sys-surface-container-highest);
        color: var(--sys-on-surface);
      }

      &.active {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
        border-color: var(--sys-primary);
      }
    }

    .batch-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--sys-surface-container-high);
      border-radius: 8px;
      padding: 3px 8px;
      border: 1px solid var(--sys-outline-variant);
    }

    .batch-label {
      font-size: 0.62rem;
      font-weight: 700;
      color: var(--sys-primary);
      letter-spacing: 0.5px;
    }

    .batch-btn-group {
      display: flex;
      gap: 4px;
    }

    .batch-btn {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: var(--sys-surface-container);
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 14px !important;
      }

      &:hover:not(:disabled) {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .grid-content {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(78px, 1fr));
      grid-auto-rows: 92px;
      gap: 8px;
      align-content: start;
    }

    .sprite-card {
      position: relative;
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 4px;
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--sys-primary);
        transform: translateY(-2px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.2);

        .card-actions {
          opacity: 1;
          pointer-events: auto;
        }
      }

      &.selected {
        background: var(--sys-primary-container);
        border: 2px solid var(--sys-primary);
        box-shadow: 0 0 0 2px rgba(0, 188, 212, 0.3);
      }

      &.is-empty {
        opacity: 0.75;
      }

      &.modified {
        border-style: dashed;
      }
    }

    .card-top {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 2px;
    }

    .id-badge {
      font-family: 'Fira Code', monospace;
      font-size: 0.62rem;
      font-weight: 700;
      color: var(--sys-primary);
    }

    .flags-group {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .flag-badge {
      font-size: 0.55rem;
      font-weight: 800;
      background: var(--sys-surface-container-highest);
      color: var(--sys-on-surface-variant);
      padding: 0 3px;
      border-radius: 3px;
    }

    .modified-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #ff9800;
    }

    .canvas-holder {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 6px;
      padding: 2px;
    }

    .cell-canvas {
      max-width: 40px;
      max-height: 40px;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    .card-bottom {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }

    .name-label {
      font-family: 'Fira Code', monospace;
      font-size: 0.58rem;
      font-weight: 600;
      color: var(--sys-on-surface);
      max-width: 70px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }

    .dim-badge {
      font-size: 0.52rem;
      color: var(--sys-on-surface-variant);
      font-weight: 500;
    }

    .card-actions {
      position: absolute;
      top: 2px;
      right: 2px;
      display: flex;
      gap: 2px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease;
      background: rgba(15, 20, 28, 0.85);
      backdrop-filter: blur(4px);
      border-radius: 6px;
      padding: 2px;
    }

    .mini-action-btn {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: none;
      background: transparent;
      color: var(--sys-on-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;

      .material-symbols-outlined {
        font-size: 12px;
      }

      &:hover {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
      }
    }

    .no-results {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 10px;
      color: var(--sys-on-surface-variant);
      gap: 6px;

      .empty-icon {
        font-size: 32px;
        opacity: 0.5;
      }
    }

    /* Custom Dimensions Modal Overlay */
    .custom-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
      padding: 12px;
    }

    .custom-modal-card {
      background: var(--sys-surface-container-high);
      border: 1.5px solid var(--sys-primary);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75);
      padding: 16px;
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .modal-icon {
      color: var(--sys-primary);
      font-size: 22px;
    }

    .modal-title {
      font-size: 0.95rem;
      font-weight: 700;
      margin: 0;
      color: var(--sys-on-surface);
    }

    .close-modal-btn {
      background: transparent;
      border: none;
      color: var(--sys-on-surface-variant);
      cursor: pointer;
      display: flex;
      align-items: center;
      padding: 2px;
      border-radius: 4px;

      &:hover {
        background: var(--sys-surface-container-highest);
        color: var(--sys-on-surface);
      }
    }

    .modal-description {
      font-size: 0.72rem;
      color: var(--sys-on-surface-variant);
      margin: 0;
      line-height: 1.3;
    }

    .modal-inputs-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .modal-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .field-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--sys-on-surface);
    }

    .cell-spinner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--sys-surface-container);
      border: 1px solid var(--sys-outline-variant);
      border-radius: 8px;
      padding: 3px 6px;
    }

    .spin-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      border: 1px solid var(--sys-outline-variant);
      background: var(--sys-surface-container-highest);
      color: var(--sys-on-surface);
      font-size: 1rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover:not(:disabled) {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
        border-color: var(--sys-primary);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .spin-val {
      font-family: 'Fira Code', monospace;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--sys-primary);
    }

    .modal-preview-box {
      background: var(--sys-surface-container);
      border: 1px dashed var(--sys-outline-variant);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 14px;
      justify-content: center;
    }

    .cells-preview-grid {
      display: grid;
      gap: 2px;
      background: rgba(0, 0, 0, 0.4);
      padding: 4px;
      border-radius: 6px;
    }

    .cell-preview-block {
      background: var(--sys-primary);
      opacity: 0.75;
      border-radius: 2px;
    }

    .preview-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .preview-tag {
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      font-weight: 800;
      color: var(--sys-primary);
    }

    .preview-dim {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--sys-on-surface);
    }

    .preview-bytes {
      font-size: 0.68rem;
      color: var(--sys-on-surface-variant);
    }

    .modal-text-input {
      background: var(--sys-surface-container);
      border: 1px solid var(--sys-outline-variant);
      border-radius: 8px;
      padding: 6px 10px;
      color: var(--sys-on-surface);
      font-family: 'Fira Code', monospace;
      font-size: 0.8rem;
      outline: none;

      &:focus {
        border-color: var(--sys-primary);
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 4px;
    }

    .modal-cancel-btn {
      background: transparent;
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;

      &:hover {
        background: var(--sys-surface-container-highest);
      }
    }

    .modal-create-btn {
      background: var(--sys-primary);
      border: 1px solid var(--sys-primary);
      color: var(--sys-on-primary);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 4px;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &:hover {
        filter: brightness(1.1);
      }
    }
  `]
})
export class SpriteListComponent implements AfterViewInit {
  spriteService = inject(SpriteService);

  searchQuery = signal<string>('');
  activeCategory = signal<'all' | 'sprites' | 'tiles' | 'non-empty'>('all');

  // Custom dimensions modal state
  showCustomModal = signal<boolean>(false);
  customWCells = signal<number>(3);
  customHCells = signal<number>(2);
  customName = signal<string>('sprite_3x2');

  @ViewChildren('spriteCanvas') spriteCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  filteredSprites = computed(() => {
    const list = this.spriteService.sprites();
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.activeCategory();

    return list.filter(sprite => {
      // Category filter
      if (cat === 'sprites' && (sprite.width < 16 && sprite.height < 16)) return false;
      if (cat === 'tiles' && (sprite.width !== 8 || sprite.height !== 8)) return false;
      if (cat === 'non-empty' && sprite.isEmpty) return false;

      // Query filter
      if (!query) return true;
      if (sprite.name.toLowerCase().includes(query)) return true;
      if (`#${sprite.id}`.includes(query) || sprite.id.toString() === query) return true;
      if (`${sprite.width}x${sprite.height}`.includes(query)) return true;

      return false;
    });
  });

  constructor() {
    effect(() => {
      this.spriteService.sprites();
      this.spriteService.palette();
      this.filteredSprites();
      setTimeout(() => this.redrawCanvases(), 0);
    });
  }

  ngAfterViewInit() {
    this.redrawCanvases();
  }

  addNewSprite(width: number, height: number, name: string) {
    this.spriteService.addSprite(width, height, name);
  }

  openCustomSizeModal() {
    const total = this.spriteService.totalSprites();
    this.customWCells.set(3);
    this.customHCells.set(2);
    this.customName.set(`sprite_3x2_#${total}`);
    this.showCustomModal.set(true);
  }

  createCustomSprite() {
    const w = this.customWCells() * 8;
    const h = this.customHCells() * 8;
    const name = this.customName().trim() || `sprite_${this.customWCells()}x${this.customHCells()}`;
    this.spriteService.addSprite(w, h, name);
    this.showCustomModal.set(false);
  }

  getCellArray(count: number): number[] {
    return Array.from({ length: count }, (_, i) => i);
  }

  nudgeVisible(direction: 'up' | 'down' | 'left' | 'right') {
    const ids = this.filteredSprites().map(s => s.id);
    this.spriteService.shiftMultipleSprites(ids, direction);
  }

  redrawCanvases() {
    if (!this.spriteCanvases) return;
    const pal = this.spriteService.palette();
    if (pal.length === 0) return;

    this.spriteCanvases.forEach(canvasRef => {
      const canvas = canvasRef.nativeElement;
      const idAttr = canvas.getAttribute('data-id');
      if (idAttr === null) return;
      const id = parseInt(idAttr, 10);
      const sprite = this.spriteService.sprites()[id];
      if (!sprite) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, sprite.width, sprite.height);

      for (let y = 0; y < sprite.height; y++) {
        for (let x = 0; x < sprite.width; x++) {
          const colorIdx = this.spriteService.getPixel(id, x, y);
          if (colorIdx > 0 && colorIdx < pal.length) {
            ctx.fillStyle = pal[colorIdx].hex;
            ctx.fillRect(x, y, 1, 1);
          }
        }
      }
    });
  }
}
