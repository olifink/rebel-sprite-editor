import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SpriteService } from '../../services/sprite.service';
import { DrawTool } from '../../models/sprite.model';
import { PaletteBarComponent } from '../palette-bar/palette-bar.component';

@Component({
  selector: 'app-pixel-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule,
    PaletteBarComponent
  ],
  template: `
    <div class="pixel-editor-container m3-card">
      <!-- Editor Header -->
      <div class="editor-header">
        <div class="sprite-meta-group" *ngIf="spriteService.selectedSprite(); let sprite">
          <span class="material-symbols-outlined header-icon">draw</span>
          <div class="sprite-title-info">
            <div class="title-row">
              <span class="sprite-id-tag">#{{ sprite.id }}</span>
              <input
                type="text"
                class="sprite-name-input"
                [ngModel]="sprite.name"
                (ngModelChange)="onNameChange($event)"
                placeholder="sprite_name"
              />
            </div>
            <span class="sprite-meta-details">
              {{ sprite.width }}x{{ sprite.height }} px ({{ sprite.pixelData.length }} bytes) • 4bpp
            </span>
          </div>

          <!-- Dimension / Cell Grid Selector (8x8 cells) -->
          <div class="dim-picker">
            <span class="dim-label">GRID:</span>
            <select
              [ngModel]="sprite.width / 8"
              (ngModelChange)="onWidthCellsChange($event)"
              class="dim-select"
              matTooltip="Sprite Width in 8x8 Character Cells"
            >
              <option *ngFor="let c of cellOptions" [value]="c">{{ c }}c ({{ c * 8 }}w)</option>
            </select>
            <span class="dim-times">✕</span>
            <select
              [ngModel]="sprite.height / 8"
              (ngModelChange)="onHeightCellsChange($event)"
              class="dim-select"
              matTooltip="Sprite Height in 8x8 Character Cells"
            >
              <option *ngFor="let c of cellOptions" [value]="c">{{ c }}c ({{ c * 8 }}h)</option>
            </select>
            <span class="dim-summary-badge">
              {{ sprite.width }}×{{ sprite.height }} px
            </span>
          </div>

          <!-- Flip Attribute Flags Checkboxes -->
          <div class="flags-picker">
            <label class="flag-toggle" [class.active]="sprite.hFlip" (click)="spriteService.toggleSpriteFlag(sprite.id, 'hFlip')" matTooltip="Horizontal Flip at Blit Time">
              <span class="material-symbols-outlined">swap_horiz</span>
              <span>H-FLIP</span>
            </label>
            <label class="flag-toggle" [class.active]="sprite.vFlip" (click)="spriteService.toggleSpriteFlag(sprite.id, 'vFlip')" matTooltip="Vertical Flip at Blit Time">
              <span class="material-symbols-outlined">swap_vert</span>
              <span>V-FLIP</span>
            </label>
          </div>
        </div>

        <!-- Sprite Navigation -->
        <div class="sprite-nav">
          <button
            mat-icon-button
            (click)="navigateSprite(-1)"
            matTooltip="Previous Sprite (Left Arrow)"
          >
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="nav-label">
            {{ spriteService.selectedSpriteIndex() + 1 }} / {{ spriteService.totalSprites() }}
          </span>
          <button
            mat-icon-button
            (click)="navigateSprite(1)"
            matTooltip="Next Sprite (Right Arrow)"
          >
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <!-- Tools Toolbar -->
      <div class="tools-bar">
        <div class="tool-group">
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'pencil'"
            (click)="activeTool.set('pencil')"
            matTooltip="Pencil (Draw Active Color)"
          >
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'brush'"
            (click)="activeTool.set('brush')"
            matTooltip="Brush (2x2 Pixels)"
          >
            <span class="material-symbols-outlined">brush</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'eraser'"
            (click)="activeTool.set('eraser')"
            matTooltip="Eraser (Paint Color 0 / Transparent)"
          >
            <span class="material-symbols-outlined">ink_eraser</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'picker'"
            (click)="activeTool.set('picker')"
            matTooltip="Eyedropper (Sample Color)"
          >
            <span class="material-symbols-outlined">colorize</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'line'"
            (click)="activeTool.set('line')"
            matTooltip="Line Tool"
          >
            <span class="material-symbols-outlined">horizontal_rule</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'rect'"
            (click)="activeTool.set('rect')"
            matTooltip="Rectangle Outline"
          >
            <span class="material-symbols-outlined">crop_square</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'rect-fill'"
            (click)="activeTool.set('rect-fill')"
            matTooltip="Rectangle Filled"
          >
            <span class="material-symbols-outlined">square</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'circle'"
            (click)="activeTool.set('circle')"
            matTooltip="Circle Outline"
          >
            <span class="material-symbols-outlined">radio_button_unchecked</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'circle-fill'"
            (click)="activeTool.set('circle-fill')"
            matTooltip="Circle Filled"
          >
            <span class="material-symbols-outlined">circle</span>
          </button>
          <button
            class="tool-btn"
            [class.active]="activeTool() === 'fill'"
            (click)="activeTool.set('fill')"
            matTooltip="Bucket Flood Fill"
          >
            <span class="material-symbols-outlined">format_color_fill</span>
          </button>
        </div>

        <div class="v-divider"></div>

        <!-- Grid Toggles -->
        <button
          class="tool-btn"
          [class.active]="showPixelGrid()"
          (click)="showPixelGrid.set(!showPixelGrid())"
          matTooltip="Toggle 1px Pixel Grid"
        >
          <span class="material-symbols-outlined">grid_4x4</span>
        </button>

        <button
          class="tool-btn"
          [class.active]="showTileGrid()"
          (click)="showTileGrid.set(!showTileGrid())"
          matTooltip="Toggle 8x8 Character Tile Division Grid"
        >
          <span class="material-symbols-outlined">grid_view</span>
        </button>

        <div class="v-divider"></div>

        <!-- Zoom Level -->
        <div class="zoom-controls">
          <span class="zoom-label">{{ zoomScale() }}x</span>
          <button
            class="mini-tool-btn"
            [disabled]="zoomScale() <= 8"
            (click)="zoomScale.set(zoomScale() - 4)"
            matTooltip="Zoom Out"
          >
            <span class="material-symbols-outlined">remove</span>
          </button>
          <button
            class="mini-tool-btn"
            [disabled]="zoomScale() >= 36"
            (click)="zoomScale.set(zoomScale() + 4)"
            matTooltip="Zoom In"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
        </div>

        <!-- Cursor Coordinate Badge -->
        <span class="cursor-coord" *ngIf="hoverCoord()">
          X: {{ hoverCoord()?.x }}, Y: {{ hoverCoord()?.y }}
        </span>
      </div>

      <!-- 16 Color Palette Bar -->
      <app-palette-bar></app-palette-bar>

      <!-- Editor Body: Interactive Canvas + Transform Tools -->
      <div class="editor-body">
        <div class="canvas-viewport">
          <div class="canvas-wrapper">
            <canvas
              #mainCanvas
              class="editor-canvas"
              (mousedown)="onMouseDown($event)"
              (mousemove)="onMouseMove($event)"
              (mouseup)="onMouseUp()"
              (mouseleave)="onMouseLeave()"
              (touchstart)="onTouchStart($event)"
              (touchmove)="onTouchMove($event)"
              (touchend)="onMouseUp()"
              (contextmenu)="$event.preventDefault()"
            ></canvas>
          </div>
        </div>

        <!-- Transformations Side Panel -->
        <div class="transform-panel">
          <div class="panel-section-title">Nudge / Shift</div>
          <div class="dpad-grid">
            <button
              class="dpad-btn up"
              (click)="spriteService.shiftSprite(spriteService.selectedSpriteIndex(), 'up')"
              matTooltip="Shift Up"
            >
              <span class="material-symbols-outlined">arrow_upward</span>
            </button>
            <button
              class="dpad-btn left"
              (click)="spriteService.shiftSprite(spriteService.selectedSpriteIndex(), 'left')"
              matTooltip="Shift Left"
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <button
              class="dpad-btn right"
              (click)="spriteService.shiftSprite(spriteService.selectedSpriteIndex(), 'right')"
              matTooltip="Shift Right"
            >
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
            <button
              class="dpad-btn down"
              (click)="spriteService.shiftSprite(spriteService.selectedSpriteIndex(), 'down')"
              matTooltip="Shift Down"
            >
              <span class="material-symbols-outlined">arrow_downward</span>
            </button>
          </div>

          <div class="panel-section-title">Transform</div>
          <div class="transform-actions">
            <button
              class="action-btn"
              (click)="spriteService.rotateSprite(spriteService.selectedSpriteIndex(), 'cw')"
              matTooltip="Rotate 90° Clockwise"
            >
              <span class="material-symbols-outlined">rotate_right</span>
              <span>Rotate</span>
            </button>
            <button
              class="action-btn"
              (click)="spriteService.flipSprite(spriteService.selectedSpriteIndex(), 'h')"
              matTooltip="Flip Horizontal Bitmap"
            >
              <span class="material-symbols-outlined">swap_horiz</span>
              <span>Flip H</span>
            </button>
            <button
              class="action-btn"
              (click)="spriteService.flipSprite(spriteService.selectedSpriteIndex(), 'v')"
              matTooltip="Flip Vertical Bitmap"
            >
              <span class="material-symbols-outlined">swap_vert</span>
              <span>Flip V</span>
            </button>
            <button
              class="action-btn"
              (click)="spriteService.copySprite(spriteService.selectedSpriteIndex())"
              matTooltip="Copy Sprite to Clipboard"
            >
              <span class="material-symbols-outlined">content_copy</span>
              <span>Copy</span>
            </button>
            <button
              class="action-btn"
              [disabled]="!spriteService.copiedSprite()"
              (click)="spriteService.pasteSprite(spriteService.selectedSpriteIndex())"
              matTooltip="Paste Copied Sprite"
            >
              <span class="material-symbols-outlined">content_paste</span>
              <span>Paste</span>
            </button>
            <button
              class="action-btn"
              (click)="spriteService.resetSprite(spriteService.selectedSpriteIndex())"
              matTooltip="Reset to Preset State"
            >
              <span class="material-symbols-outlined">restart_alt</span>
              <span>Reset</span>
            </button>
            <button
              class="action-btn"
              (click)="spriteService.clearSprite(spriteService.selectedSpriteIndex())"
              matTooltip="Clear Pixels"
            >
              <span class="material-symbols-outlined">delete</span>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Row Nibbles & Bytes Inspector -->
      <div class="bytes-inspector" *ngIf="spriteService.selectedSprite(); let s">
        <div class="inspector-header">
          <span class="material-symbols-outlined">data_object</span>
          <span class="inspector-title">4bpp Row Bytes Inspector ({{ s.width / 2 }} bytes per row)</span>
        </div>

        <div class="row-bytes-list">
          <div *ngFor="let row of getRowBytesData(); let r = index" class="byte-row">
            <span class="row-tag">Row {{ r }}</span>
            <div class="nibble-chips">
              <span
                *ngFor="let n of row.nibbles; let x = index"
                class="nibble-chip"
                [style.borderLeftColor]="spriteService.palette()[n]?.hex || '#000'"
                [matTooltip]="'Col ' + x + ': Color Index ' + n"
              >
                {{ n.toString(16).toUpperCase() }}
              </span>
            </div>
            <span class="hex-bytes-text">{{ row.hexBytes }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pixel-editor-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--sys-surface-container);
      border-radius: 16px;
      border: 1px solid var(--sys-outline-variant);
      padding: 14px;
      gap: 10px;
      overflow-y: auto;
    }

    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--sys-outline-variant);
      flex-wrap: wrap;
      gap: 8px;
    }

    .sprite-meta-group {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .header-icon {
      color: var(--sys-primary);
      font-size: 26px;
    }

    .sprite-title-info {
      display: flex;
      flex-direction: column;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .sprite-id-tag {
      font-family: 'Fira Code', monospace;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--sys-primary);
    }

    .sprite-name-input {
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      border-radius: 6px;
      padding: 2px 6px;
      color: var(--sys-on-surface);
      font-family: 'Fira Code', monospace;
      font-size: 0.95rem;
      font-weight: 700;
      outline: none;
      width: 140px;

      &:focus {
        border-color: var(--sys-primary);
      }
    }

    .sprite-meta-details {
      font-size: 0.72rem;
      color: var(--sys-on-surface-variant);
      font-weight: 500;
    }

    .dim-picker {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--sys-surface-container-high);
      padding: 3px 8px;
      border-radius: 8px;
      border: 1px solid var(--sys-outline-variant);
    }

    .dim-label {
      font-size: 0.65rem;
      font-weight: 800;
      color: var(--sys-primary);
      letter-spacing: 0.5px;
    }

    .dim-times {
      font-size: 0.7rem;
      color: var(--sys-on-surface-variant);
      font-weight: 700;
    }

    .dim-select {
      background: transparent;
      border: none;
      color: var(--sys-on-surface);
      font-family: 'Fira Code', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      outline: none;
      cursor: pointer;

      option {
        background: var(--sys-surface-container-highest);
        color: var(--sys-on-surface);
      }
    }

    .dim-summary-badge {
      font-family: 'Fira Code', monospace;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--sys-primary);
      background: var(--sys-surface-container-highest);
      padding: 1px 6px;
      border-radius: 6px;
      border: 1px solid var(--sys-outline-variant);
      margin-left: 2px;
    }

    .flags-picker {
      display: flex;
      gap: 4px;
    }

    .flag-toggle {
      display: flex;
      align-items: center;
      gap: 3px;
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      border-radius: 8px;
      padding: 3px 8px;
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--sys-on-surface-variant);
      cursor: pointer;
      user-select: none;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &.active {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
        border-color: var(--sys-primary);
      }
    }

    .sprite-nav {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--sys-surface-container-high);
      border-radius: 20px;
      padding: 2px 8px;
      border: 1px solid var(--sys-outline-variant);
    }

    .nav-label {
      font-family: 'Fira Code', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--sys-on-surface);
    }

    .tools-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--sys-surface-container-high);
      padding: 6px 10px;
      border-radius: 12px;
      border: 1px solid var(--sys-outline-variant);
      flex-wrap: wrap;
    }

    .tool-group {
      display: flex;
      gap: 3px;
    }

    .tool-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--sys-on-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 18px;
      }

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

    .v-divider {
      width: 1px;
      height: 20px;
      background: var(--sys-outline-variant);
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--sys-surface-container);
      padding: 2px 6px;
      border-radius: 8px;
      border: 1px solid var(--sys-outline-variant);
    }

    .zoom-label {
      font-family: 'Fira Code', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--sys-on-surface);
    }

    .mini-tool-btn {
      width: 22px;
      height: 22px;
      border-radius: 4px;
      background: transparent;
      border: none;
      color: var(--sys-on-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      .material-symbols-outlined {
        font-size: 14px;
      }

      &:hover:not(:disabled) {
        background: var(--sys-surface-container-highest);
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }

    .cursor-coord {
      font-family: 'Fira Code', monospace;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--sys-primary);
      margin-left: auto;
    }

    .editor-body {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      justify-content: center;
      flex-wrap: wrap;
    }

    .canvas-viewport {
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      background: var(--sys-surface-container-highest);
      border-radius: 12px;
      padding: 12px;
      border: 2px solid var(--sys-outline-variant);
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      flex: 1;
      min-height: 160px;
      max-height: 55vh;
    }

    .canvas-wrapper {
      position: relative;
    }

    .editor-canvas {
      display: block;
      border-radius: 6px;
      cursor: crosshair;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      user-select: none;
      touch-action: none;
    }

    .transform-panel {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 140px;
    }

    .panel-section-title {
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--sys-primary);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .dpad-grid {
      display: grid;
      grid-template-columns: repeat(3, 34px);
      grid-template-rows: repeat(3, 34px);
      gap: 3px;
      justify-content: center;
    }

    .dpad-btn {
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 16px;
      }

      &:hover {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
      }

      &.up { grid-column: 2; grid-row: 1; }
      &.left { grid-column: 1; grid-row: 2; }
      &.right { grid-column: 3; grid-row: 2; }
      &.down { grid-column: 2; grid-row: 3; }
    }

    .transform-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4px;
    }

    .action-btn {
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface);
      border-radius: 8px;
      padding: 5px;
      font-size: 0.68rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 14px;
      }

      &:hover:not(:disabled) {
        background: var(--sys-surface-container-highest);
        border-color: var(--sys-primary);
      }

      &:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
    }

    .bytes-inspector {
      background: var(--sys-surface-container-high);
      border-radius: 12px;
      padding: 10px;
      border: 1px solid var(--sys-outline-variant);
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
    }

    .inspector-header {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--sys-primary);

      .material-symbols-outlined {
        font-size: 16px;
      }
    }

    .inspector-title {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .row-bytes-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .byte-row {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--sys-surface-container);
      padding: 3px 8px;
      border-radius: 6px;
    }

    .row-tag {
      font-family: 'Fira Code', monospace;
      font-size: 0.65rem;
      color: var(--sys-on-surface-variant);
      width: 45px;
    }

    .nibble-chips {
      display: flex;
      gap: 2px;
      flex-wrap: wrap;
    }

    .nibble-chip {
      font-family: 'Fira Code', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      background: var(--sys-surface-container-highest);
      color: var(--sys-on-surface);
      padding: 1px 4px;
      border-radius: 3px;
      border-left: 3px solid transparent;
    }

    .hex-bytes-text {
      font-family: 'Fira Code', monospace;
      font-size: 0.68rem;
      color: var(--sys-on-surface-variant);
      margin-left: auto;
    }
  `]
})
export class PixelEditorComponent implements AfterViewInit {
  spriteService = inject(SpriteService);

  activeTool = signal<DrawTool>('pencil');
  showPixelGrid = signal<boolean>(true);
  showTileGrid = signal<boolean>(true);
  zoomScale = signal<number>(18);
  hoverCoord = signal<{ x: number; y: number } | null>(null);

  @ViewChild('mainCanvas') mainCanvasRef!: ElementRef<HTMLCanvasElement>;

  private isDrawing = false;
  private startCell: { x: number; y: number } | null = null;
  private tempPixels: Uint8Array | null = null;

  constructor() {
    effect(() => {
      this.spriteService.selectedSprite();
      this.spriteService.palette();
      this.showPixelGrid();
      this.showTileGrid();
      this.zoomScale();
      setTimeout(() => this.drawCanvas(), 0);
    });
  }

  ngAfterViewInit() {
    this.drawCanvas();
  }

  navigateSprite(delta: number) {
    const total = this.spriteService.totalSprites();
    if (total === 0) return;
    const current = this.spriteService.selectedSpriteIndex();
    const next = (current + delta + total) % total;
    this.spriteService.selectSprite(next);
  }

  onNameChange(name: string) {
    const s = this.spriteService.selectedSprite();
    if (s) {
      this.spriteService.setSpriteName(s.id, name);
    }
  }

  cellOptions = [1, 2, 3, 4, 5, 6, 7, 8];

  onWidthCellsChange(cells: number | string) {
    const s = this.spriteService.selectedSprite();
    if (!s) return;
    const wCells = typeof cells === 'string' ? parseInt(cells, 10) : cells;
    if (!isNaN(wCells) && wCells >= 1 && wCells <= 8) {
      this.spriteService.resizeSprite(s.id, wCells * 8, s.height);
    }
  }

  onHeightCellsChange(cells: number | string) {
    const s = this.spriteService.selectedSprite();
    if (!s) return;
    const hCells = typeof cells === 'string' ? parseInt(cells, 10) : cells;
    if (!isNaN(hCells) && hCells >= 1 && hCells <= 8) {
      this.spriteService.resizeSprite(s.id, s.width, hCells * 8);
    }
  }

  onDimensionChange(dimStr: string) {
    const parts = dimStr.split('x');
    if (parts.length === 2) {
      const w = parseInt(parts[0], 10);
      const h = parseInt(parts[1], 10);
      const s = this.spriteService.selectedSprite();
      if (s && !isNaN(w) && !isNaN(h)) {
        this.spriteService.resizeSprite(s.id, w, h);
      }
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      if (event.ctrlKey || event.metaKey) {
        this.spriteService.shiftSprite(this.spriteService.selectedSpriteIndex(), 'left');
      } else {
        this.navigateSprite(-1);
      }
    } else if (event.key === 'ArrowRight') {
      if (event.ctrlKey || event.metaKey) {
        this.spriteService.shiftSprite(this.spriteService.selectedSpriteIndex(), 'right');
      } else {
        this.navigateSprite(1);
      }
    } else if (event.key === 'ArrowUp' && (event.ctrlKey || event.metaKey)) {
      this.spriteService.shiftSprite(this.spriteService.selectedSpriteIndex(), 'up');
    } else if (event.key === 'ArrowDown' && (event.ctrlKey || event.metaKey)) {
      this.spriteService.shiftSprite(this.spriteService.selectedSpriteIndex(), 'down');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        this.spriteService.redo();
      } else {
        this.spriteService.undo();
      }
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      this.spriteService.redo();
    }
  }

  getRowBytesData() {
    const s = this.spriteService.selectedSprite();
    if (!s) return [];

    const rows = [];
    const bytesPerRow = s.width / 2;

    for (let y = 0; y < s.height; y++) {
      const nibbles: number[] = [];
      const hexParts: string[] = [];

      for (let x = 0; x < s.width; x++) {
        nibbles.push(this.spriteService.getPixel(s.id, x, y));
      }

      for (let c = 0; c < bytesPerRow; c++) {
        const b = s.pixelData[y * bytesPerRow + c];
        hexParts.push('0x' + b.toString(16).padStart(2, '0').toUpperCase());
      }

      rows.push({
        y,
        nibbles,
        hexBytes: hexParts.join(' ')
      });
    }

    return rows;
  }

  private getCellCoordinates(e: MouseEvent | Touch): { x: number; y: number } | null {
    if (!this.mainCanvasRef) return null;
    const canvas = this.mainCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const s = this.spriteService.selectedSprite();
    if (!s) return null;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const cellW = rect.width / s.width;
    const cellH = rect.height / s.height;

    const x = Math.floor(mouseX / cellW);
    const y = Math.floor(mouseY / cellH);

    if (x >= 0 && x < s.width && y >= 0 && y < s.height) {
      return { x, y };
    }
    return null;
  }

  onMouseDown(e: MouseEvent) {
    const coords = this.getCellCoordinates(e);
    if (!coords) return;
    const isRightClick = e.button === 2;
    this.startDrawing(coords, isRightClick);
  }

  onTouchStart(e: TouchEvent) {
    if (e.touches.length === 0) return;
    const coords = this.getCellCoordinates(e.touches[0]);
    if (!coords) return;
    this.startDrawing(coords, false);
  }

  private startDrawing(coords: { x: number; y: number }, isRightClick: boolean) {
    const s = this.spriteService.selectedSprite();
    if (!s) return;

    this.isDrawing = true;
    this.startCell = coords;

    const tool = this.activeTool();
    const color = isRightClick ? this.spriteService.secondaryColorIndex() : (tool === 'eraser' ? 0 : this.spriteService.selectedColorIndex());

    if (tool === 'picker') {
      const sampled = this.spriteService.getPixel(s.id, coords.x, coords.y);
      this.spriteService.selectedColorIndex.set(sampled);
      this.isDrawing = false;
      return;
    }

    if (tool === 'pencil' || tool === 'eraser') {
      this.spriteService.setPixel(s.id, coords.x, coords.y, color);
    } else if (tool === 'brush') {
      this.drawBrush(coords.x, coords.y, color);
    } else if (tool === 'fill') {
      this.floodFill(coords.x, coords.y, color);
      this.isDrawing = false;
    } else if (tool === 'line' || tool === 'rect' || tool === 'rect-fill' || tool === 'circle' || tool === 'circle-fill') {
      this.tempPixels = new Uint8Array(s.pixelData);
    }
  }

  onMouseMove(e: MouseEvent) {
    const coords = this.getCellCoordinates(e);
    this.hoverCoord.set(coords);
    if (!this.isDrawing || !coords) return;
    const isRightClick = e.buttons === 2;
    this.continueDrawing(coords, isRightClick);
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDrawing || e.touches.length === 0) return;
    const coords = this.getCellCoordinates(e.touches[0]);
    this.hoverCoord.set(coords);
    if (!coords) return;
    this.continueDrawing(coords, false);
  }

  private continueDrawing(coords: { x: number; y: number }, isRightClick: boolean) {
    const s = this.spriteService.selectedSprite();
    if (!s) return;

    const tool = this.activeTool();
    const color = isRightClick ? this.spriteService.secondaryColorIndex() : (tool === 'eraser' ? 0 : this.spriteService.selectedColorIndex());

    if (tool === 'pencil' || tool === 'eraser') {
      this.spriteService.setPixel(s.id, coords.x, coords.y, color);
    } else if (tool === 'brush') {
      this.drawBrush(coords.x, coords.y, color);
    } else if (tool === 'picker') {
      const sampled = this.spriteService.getPixel(s.id, coords.x, coords.y);
      this.spriteService.selectedColorIndex.set(sampled);
    } else if (this.startCell && this.tempPixels) {
      const working = new Uint8Array(this.tempPixels);
      if (tool === 'line') {
        this.drawLineOnBuffer(working, s.width, s.height, this.startCell.x, this.startCell.y, coords.x, coords.y, color);
      } else if (tool === 'rect') {
        this.drawRectOnBuffer(working, s.width, s.height, this.startCell.x, this.startCell.y, coords.x, coords.y, color, false);
      } else if (tool === 'rect-fill') {
        this.drawRectOnBuffer(working, s.width, s.height, this.startCell.x, this.startCell.y, coords.x, coords.y, color, true);
      } else if (tool === 'circle') {
        this.drawCircleOnBuffer(working, s.width, s.height, this.startCell.x, this.startCell.y, coords.x, coords.y, color, false);
      } else if (tool === 'circle-fill') {
        this.drawCircleOnBuffer(working, s.width, s.height, this.startCell.x, this.startCell.y, coords.x, coords.y, color, true);
      }
      this.spriteService.setSpritePixelData(s.id, working);
    }
  }

  onMouseUp() {
    this.isDrawing = false;
    this.startCell = null;
    this.tempPixels = null;
  }

  onMouseLeave() {
    this.hoverCoord.set(null);
    this.onMouseUp();
  }

  private drawBrush(cx: number, cy: number, color: number) {
    const s = this.spriteService.selectedSprite();
    if (!s) return;
    this.spriteService.setPixel(s.id, cx, cy, color);
    if (cx + 1 < s.width) this.spriteService.setPixel(s.id, cx + 1, cy, color);
    if (cy + 1 < s.height) this.spriteService.setPixel(s.id, cx, cy + 1, color);
    if (cx + 1 < s.width && cy + 1 < s.height) this.spriteService.setPixel(s.id, cx + 1, cy + 1, color);
  }

  private floodFill(startX: number, startY: number, newColor: number) {
    const s = this.spriteService.selectedSprite();
    if (!s) return;

    const targetColor = this.spriteService.getPixel(s.id, startX, startY);
    if (targetColor === newColor) return;

    const working = new Uint8Array(s.pixelData);
    const w = s.width;
    const h = s.height;
    const queue: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const visited = new Uint8Array(w * h);

    const getBufPixel = (px: number, py: number) => {
      const byteIdx = py * (w / 2) + (px >> 1);
      const b = working[byteIdx];
      return (px % 2 === 0) ? ((b >> 4) & 0x0f) : (b & 0x0f);
    };

    const setBufPixel = (px: number, py: number, col: number) => {
      const byteIdx = py * (w / 2) + (px >> 1);
      const b = working[byteIdx];
      const safe = col & 0x0f;
      if (px % 2 === 0) {
        working[byteIdx] = (safe << 4) | (b & 0x0f);
      } else {
        working[byteIdx] = (b & 0xf0) | safe;
      }
    };

    while (queue.length > 0) {
      const { x, y } = queue.pop()!;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;

      const idx = y * w + x;
      if (visited[idx]) continue;
      visited[idx] = 1;

      if (getBufPixel(x, y) === targetColor) {
        setBufPixel(x, y, newColor);
        queue.push({ x: x + 1, y });
        queue.push({ x: x - 1, y });
        queue.push({ x, y: y + 1 });
        queue.push({ x, y: y - 1 });
      }
    }

    this.spriteService.setSpritePixelData(s.id, working);
  }

  private setPixelOnBuffer(buf: Uint8Array, w: number, h: number, x: number, y: number, color: number) {
    if (x < 0 || x >= w || y < 0 || y >= h) return;
    const byteIdx = y * (w / 2) + (x >> 1);
    const b = buf[byteIdx];
    const safe = color & 0x0f;
    if (x % 2 === 0) {
      buf[byteIdx] = (safe << 4) | (b & 0x0f);
    } else {
      buf[byteIdx] = (b & 0xf0) | safe;
    }
  }

  private drawLineOnBuffer(buf: Uint8Array, w: number, h: number, x0: number, y0: number, x1: number, y1: number, color: number) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1;
    let sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    while (true) {
      this.setPixelOnBuffer(buf, w, h, x, y, color);
      if (x === x1 && y === y1) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  private drawRectOnBuffer(buf: Uint8Array, w: number, h: number, x0: number, y0: number, x1: number, y1: number, color: number, fill: boolean) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (fill || x === minX || x === maxX || y === minY || y === maxY) {
          this.setPixelOnBuffer(buf, w, h, x, y, color);
        }
      }
    }
  }

  private drawCircleOnBuffer(buf: Uint8Array, w: number, h: number, x0: number, y0: number, x1: number, y1: number, color: number, fill: boolean) {
    const radius = Math.round(Math.hypot(x1 - x0, y1 - y0));
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        const dist = Math.hypot(x, y);
        if (fill) {
          if (dist <= radius) {
            this.setPixelOnBuffer(buf, w, h, x0 + x, y0 + y, color);
          }
        } else {
          if (Math.abs(dist - radius) < 0.75) {
            this.setPixelOnBuffer(buf, w, h, x0 + x, y0 + y, color);
          }
        }
      }
    }
  }

  private drawCanvas() {
    if (!this.mainCanvasRef) return;
    const canvas = this.mainCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = this.spriteService.selectedSprite();
    if (!s) return;

    const zoom = this.zoomScale();
    canvas.width = s.width * zoom;
    canvas.height = s.height * zoom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const pal = this.spriteService.palette();

    // 1. Draw Checkerboard background for transparent areas
    const checkSize = zoom / 2;
    for (let y = 0; y < canvas.height; y += checkSize) {
      for (let x = 0; x < canvas.width; x += checkSize) {
        const isDark = ((x / checkSize) + (y / checkSize)) % 2 === 0;
        ctx.fillStyle = isDark ? '#141923' : '#1d2330';
        ctx.fillRect(x, y, checkSize, checkSize);
      }
    }

    // 2. Render Pixels
    for (let y = 0; y < s.height; y++) {
      for (let x = 0; x < s.width; x++) {
        const colorIdx = this.spriteService.getPixel(s.id, x, y);
        if (colorIdx > 0 && colorIdx < pal.length) {
          ctx.fillStyle = pal[colorIdx].hex;
          ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
        }
      }
    }

    // 3. Render 1px Pixel Grid if enabled
    if (this.showPixelGrid() && zoom >= 10) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;

      for (let x = 1; x < s.width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, canvas.height);
        ctx.stroke();
      }

      for (let y = 1; y < s.height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(canvas.width, y * zoom);
        ctx.stroke();
      }
    }

    // 4. Render 8x8 Character Tile division grid if enabled
    if (this.showTileGrid() && (s.width > 8 || s.height > 8)) {
      ctx.strokeStyle = 'rgba(0, 188, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);

      for (let x = 8; x < s.width; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, canvas.height);
        ctx.stroke();
      }

      for (let y = 8; y < s.height; y += 8) {
        ctx.beginPath();
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(canvas.width, y * zoom);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  }
}
