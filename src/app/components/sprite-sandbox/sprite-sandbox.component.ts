import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  HostListener,
  effect,
  inject,
  signal,
  computed,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { SpriteService } from '../../services/sprite.service';

interface SandboxBg {
  name: string;
  color: string;
  isCheck: boolean;
}

export type SandboxViewMode = 'collapsed' | 'standard' | 'maximized';

@Component({
  selector: 'app-sprite-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSliderModule,
    MatTabsModule
  ],
  template: `
    <div
      class="sandbox-container m3-card"
      [class.collapsed]="isCollapsed()"
      [class.maximized]="isMaximized()"
    >
      <!-- Header bar -->
      <div class="sandbox-header" (click)="onHeaderClick()">
        <div class="header-title-group">
          <span class="material-symbols-outlined header-icon">sports_esports</span>
          <h2 class="section-title">Live Animation & Scene Sandbox</h2>
          <span class="view-mode-badge" *ngIf="isMaximized()">Maximized</span>
        </div>

        <div class="header-actions" (click)="$event.stopPropagation()">
          <!-- Export PNG -->
          <button
            *ngIf="!isCollapsed()"
            mat-stroked-button
            class="export-img-btn"
            (click)="downloadActiveViewImage()"
            matTooltip="Export current sandbox canvas to PNG"
          >
            <span class="material-symbols-outlined">image</span>
            <span>Export PNG</span>
          </button>

          <!-- Maximize / Restore Button -->
          <button
            *ngIf="!isCollapsed()"
            mat-icon-button
            class="mode-action-btn"
            (click)="toggleMaximize()"
            [matTooltip]="isMaximized() ? 'Restore standard view (Esc)' : 'Maximize Sandbox view'"
          >
            <span class="material-symbols-outlined">
              {{ isMaximized() ? 'close_fullscreen' : 'open_in_full' }}
            </span>
          </button>

          <!-- Collapse / Expand Button -->
          <button
            mat-icon-button
            class="mode-action-btn"
            (click)="toggleCollapse()"
            [matTooltip]="isCollapsed() ? 'Expand Sandbox' : 'Collapse Sandbox'"
          >
            <span class="material-symbols-outlined">
              {{ isCollapsed() ? 'expand_less' : 'expand_more' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Sandbox Body Content -->
      <div class="sandbox-body" *ngIf="!isCollapsed()">
        <!-- Sandbox Mode Tabs -->
        <mat-tab-group
          class="sandbox-tabs"
          [selectedIndex]="activeTab()"
          (selectedIndexChange)="onTabChange($event)"
        >
          <!-- TAB 1: Animation Player -->
          <mat-tab label="Animation Player">
            <div class="tab-pane-content">
              <!-- Controls Bar -->
              <div class="settings-bar">
                <div class="anim-playback-group">
                  <button
                    class="anim-ctrl-btn"
                    (click)="stepFrame(-1)"
                    matTooltip="Previous Frame"
                  >
                    <span class="material-symbols-outlined">skip_previous</span>
                  </button>

                  <button
                    class="anim-ctrl-btn play-btn"
                    (click)="togglePlay()"
                    [matTooltip]="isPlaying() ? 'Pause Animation' : 'Play Animation'"
                  >
                    <span class="material-symbols-outlined">{{ isPlaying() ? 'pause' : 'play_arrow' }}</span>
                  </button>

                  <button
                    class="anim-ctrl-btn"
                    (click)="stepFrame(1)"
                    matTooltip="Next Frame"
                  >
                    <span class="material-symbols-outlined">skip_next</span>
                  </button>
                </div>

                <div class="setting-item">
                  <span class="setting-label">FPS: {{ fps() }}</span>
                  <mat-slider min="1" max="30" step="1" class="custom-slider">
                    <input matSliderThumb [ngModel]="fps()" (ngModelChange)="fps.set($event)" />
                  </mat-slider>
                </div>

                <div class="setting-item">
                  <span class="setting-label">Scale: {{ animScale() }}x</span>
                  <mat-slider min="1" max="12" step="1" class="custom-slider">
                    <input matSliderThumb [ngModel]="animScale()" (ngModelChange)="animScale.set($event)" />
                  </mat-slider>
                </div>

                <div class="setting-item">
                  <span class="setting-label">Frames:</span>
                  <input
                    type="text"
                    [ngModel]="frameSequenceText()"
                    (ngModelChange)="onFrameSequenceChange($event)"
                    placeholder="0,1,2,3"
                    class="frames-input"
                    matTooltip="Comma-separated sprite IDs (e.g. 0,1,2,3)"
                  />
                </div>

                <!-- Background swatches -->
                <div class="setting-item">
                  <span class="setting-label">BG:</span>
                  <div class="bg-swatches">
                    <button
                      *ngFor="let bg of bgList"
                      class="bg-btn"
                      [class.active]="selectedBg().name === bg.name"
                      [style.background]="bg.color"
                      (click)="selectedBg.set(bg)"
                      [matTooltip]="bg.name"
                    ></button>
                  </div>
                </div>
              </div>

              <!-- Animation Canvas -->
              <div class="canvas-display-wrapper" [style.background]="selectedBg().color">
                <canvas #animCanvas class="anim-render-canvas"></canvas>
                <div class="frame-tag">
                  Frame: {{ currentFrameIndex() + 1 }} / {{ frameList().length }} (Sprite #{{ currentSpriteId() }})
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- TAB 2: 2D Tilemap / Scene Stage -->
          <mat-tab label="Tilemap & Scene Stage">
            <div class="tab-pane-content">
              <div class="settings-bar">
                <div class="stage-tools-group">
                  <button
                    class="preset-chip"
                    (click)="fillStageWithCurrent()"
                    matTooltip="Fill entire stage with selected tile/sprite"
                  >
                    <span class="material-symbols-outlined">format_color_fill</span>
                    <span>Fill Stage</span>
                  </button>

                  <button
                    class="preset-chip"
                    (click)="clearStage()"
                    matTooltip="Clear Stage"
                  >
                    <span class="material-symbols-outlined">clear_all</span>
                    <span>Clear Stage</span>
                  </button>
                </div>

                <div class="setting-item">
                  <span class="setting-label">Stage Scale: {{ stageScale() }}x</span>
                  <mat-slider min="2" max="8" step="1" class="custom-slider">
                    <input matSliderThumb [ngModel]="stageScale()" (ngModelChange)="stageScale.set($event)" />
                  </mat-slider>
                </div>

                <span class="stage-hint">
                  Click/drag on stage to place active sprite #{{ spriteService.selectedSpriteIndex() }}
                </span>
              </div>

              <!-- Stage Canvas -->
              <div class="canvas-display-wrapper stage-wrapper">
                <canvas
                  #stageCanvas
                  class="stage-render-canvas"
                  (mousedown)="onStageMouseDown($event)"
                  (mousemove)="onStageMouseMove($event)"
                  (mouseup)="isStageDrawing = false"
                  (mouseleave)="isStageDrawing = false"
                ></canvas>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [`
    .sandbox-container {
      display: flex;
      flex-direction: column;
      background: var(--sys-surface-container);
      border-radius: 16px;
      border: 1px solid var(--sys-outline-variant);
      padding: 12px 16px;
      gap: 8px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      max-height: 100%;
      overflow: hidden;

      &.collapsed {
        padding: 10px 16px;
        gap: 0;
      }

      &.maximized {
        position: fixed;
        top: 76px;
        left: 16px;
        right: 16px;
        bottom: 16px;
        height: calc(100vh - 92px) !important;
        max-height: calc(100vh - 92px) !important;
        z-index: 1000;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        background: var(--sys-surface-container);
        border: 1.5px solid var(--sys-primary);

        .canvas-display-wrapper {
          min-height: 380px;
          height: calc(100vh - 270px);
        }
      }
    }

    .sandbox-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
    }

    .header-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
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
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .view-mode-badge {
      font-family: 'Fira Code', monospace;
      font-size: 0.65rem;
      font-weight: 700;
      color: var(--sys-primary);
      background: rgba(0, 188, 212, 0.15);
      border: 1px solid rgba(0, 188, 212, 0.35);
      padding: 2px 8px;
      border-radius: 8px;
      letter-spacing: 0.5px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mode-action-btn {
      color: var(--sys-on-surface);

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .export-img-btn {
      border-radius: 14px !important;
      height: 28px !important;
      font-size: 0.72rem !important;
      font-weight: 600 !important;

      .material-symbols-outlined {
        font-size: 16px !important;
      }
    }

    .sandbox-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      overflow-y: auto;
    }

    .tab-pane-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 8px;
      height: 100%;
    }

    .settings-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      background: var(--sys-surface-container-high);
      padding: 6px 12px;
      border-radius: 10px;
      border: 1px solid var(--sys-outline-variant);
    }

    .anim-playback-group {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .anim-ctrl-btn {
      width: 28px;
      height: 28px;
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
        font-size: 16px;
      }

      &:hover {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
      }

      &.play-btn {
        background: var(--sys-primary-container);
        color: var(--sys-on-primary-container);
        border-color: var(--sys-primary);
      }
    }

    .setting-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .setting-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--sys-on-surface-variant);
      white-space: nowrap;
    }

    .custom-slider {
      width: 80px;
    }

    .frames-input {
      background: var(--sys-surface-container);
      border: 1px solid var(--sys-outline-variant);
      border-radius: 6px;
      padding: 2px 6px;
      color: var(--sys-primary);
      font-family: 'Fira Code', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      width: 90px;
      outline: none;

      &:focus {
        border-color: var(--sys-primary);
      }
    }

    .bg-swatches {
      display: flex;
      gap: 4px;
    }

    .bg-btn {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 1px solid rgba(255,255,255,0.2);
      cursor: pointer;
      padding: 0;

      &.active {
        border-color: var(--sys-primary);
        box-shadow: 0 0 0 2px var(--sys-primary);
      }
    }

    .canvas-display-wrapper {
      position: relative;
      min-height: 110px;
      border-radius: 10px;
      border: 1px solid var(--sys-outline-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px;
      overflow: auto;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
      flex: 1;
    }

    .anim-render-canvas {
      display: block;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }

    .frame-tag {
      position: absolute;
      bottom: 6px;
      right: 8px;
      font-family: 'Fira Code', monospace;
      font-size: 0.65rem;
      font-weight: 600;
      background: rgba(15, 20, 28, 0.75);
      backdrop-filter: blur(4px);
      padding: 2px 8px;
      border-radius: 6px;
      color: var(--sys-on-surface-variant);
    }

    .stage-tools-group {
      display: flex;
      gap: 6px;
    }

    .preset-chip {
      background: var(--sys-surface-container);
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface);
      border-radius: 10px;
      padding: 3px 8px;
      font-size: 0.68rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;

      .material-symbols-outlined {
        font-size: 14px;
      }

      &:hover {
        background: var(--sys-primary);
        color: var(--sys-on-primary);
      }
    }

    .stage-hint {
      font-size: 0.68rem;
      color: var(--sys-on-surface-variant);
      margin-left: auto;
    }

    .stage-wrapper {
      min-height: 140px;
    }

    .stage-render-canvas {
      display: block;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      cursor: cell;
      border-radius: 6px;
    }
  `]
})
export class SpriteSandboxComponent implements AfterViewInit, OnDestroy {
  spriteService = inject(SpriteService);

  maximizedChange = output<boolean>();

  viewMode = signal<SandboxViewMode>('standard');
  isCollapsed = computed(() => this.viewMode() === 'collapsed');
  isMaximized = computed(() => this.viewMode() === 'maximized');

  activeTab = signal<number>(0);

  // Animation player state
  isPlaying = signal<boolean>(true);
  fps = signal<number>(6);
  animScale = signal<number>(4);
  frameSequenceText = signal<string>('0, 1, 2, 3');
  currentFrameIndex = signal<number>(0);

  bgList: SandboxBg[] = [
    { name: 'Dark Void', color: '#0a0e14', isCheck: false },
    { name: 'Pure Black', color: '#000000', isCheck: false },
    { name: 'CRT Matrix Green', color: '#051408', isCheck: false },
    { name: 'Amber CRT', color: '#1a1000', isCheck: false },
    { name: 'Retro Navy', color: '#121b28', isCheck: false }
  ];
  selectedBg = signal<SandboxBg>(this.bgList[0]);

  // Stage state
  stageScale = signal<number>(3);
  stageGridCols = 24;
  stageGridRows = 12;
  stageGrid: number[][] = []; // Stores spriteId placed on (row, col)
  isStageDrawing = false;

  @ViewChild('animCanvas') animCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stageCanvas') stageCanvasRef!: ElementRef<HTMLCanvasElement>;

  private animTimer: any = null;

  constructor() {
    this.initStageGrid();

    effect(() => {
      this.spriteService.sprites();
      this.spriteService.palette();
      this.animScale();
      this.selectedBg();
      this.stageScale();
      if (!this.isCollapsed()) {
        setTimeout(() => {
          this.renderAnimFrame();
          this.renderStage();
        }, 0);
      }
    });

    effect(() => {
      const playing = this.isPlaying();
      const speed = this.fps();
      this.setupAnimLoop(playing, speed);
    });
  }

  ngAfterViewInit() {
    this.renderAnimFrame();
    this.renderStage();
    this.setupAnimLoop(this.isPlaying(), this.fps());
  }

  ngOnDestroy() {
    if (this.animTimer) clearInterval(this.animTimer);
  }

  @HostListener('window:keydown.escape')
  onEscapeKey() {
    if (this.isMaximized()) {
      this.setViewMode('standard');
    }
  }

  setViewMode(mode: SandboxViewMode) {
    this.viewMode.set(mode);
    this.maximizedChange.emit(mode === 'maximized');
    if (mode !== 'collapsed') {
      setTimeout(() => {
        this.renderAnimFrame();
        this.renderStage();
      }, 50);
    }
  }

  toggleCollapse() {
    if (this.isCollapsed()) {
      this.setViewMode('standard');
    } else {
      this.setViewMode('collapsed');
    }
  }

  toggleMaximize() {
    if (this.isMaximized()) {
      this.setViewMode('standard');
    } else {
      this.setViewMode('maximized');
    }
  }

  onHeaderClick() {
    if (this.isCollapsed()) {
      this.setViewMode('standard');
    }
  }

  onTabChange(index: number) {
    this.activeTab.set(index);
    setTimeout(() => {
      if (index === 0) this.renderAnimFrame();
      else if (index === 1) this.renderStage();
    }, 50);
  }

  frameList = () => {
    const text = this.frameSequenceText();
    const parts = text.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
    if (parts.length === 0) {
      return [this.spriteService.selectedSpriteIndex()];
    }
    return parts;
  };

  currentSpriteId = () => {
    const list = this.frameList();
    const idx = this.currentFrameIndex() % list.length;
    return list[idx] ?? 0;
  };

  onFrameSequenceChange(val: string) {
    this.frameSequenceText.set(val);
    this.currentFrameIndex.set(0);
    this.renderAnimFrame();
  }

  togglePlay() {
    this.isPlaying.set(!this.isPlaying());
  }

  stepFrame(delta: number) {
    this.isPlaying.set(false);
    const list = this.frameList();
    if (list.length === 0) return;
    const next = (this.currentFrameIndex() + delta + list.length) % list.length;
    this.currentFrameIndex.set(next);
    this.renderAnimFrame();
  }

  private setupAnimLoop(playing: boolean, speed: number) {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
    if (playing) {
      const intervalMs = Math.max(16, Math.round(1000 / speed));
      this.animTimer = setInterval(() => {
        const list = this.frameList();
        if (list.length > 0) {
          const next = (this.currentFrameIndex() + 1) % list.length;
          this.currentFrameIndex.set(next);
          this.renderAnimFrame();
        }
      }, intervalMs);
    }
  }

  renderAnimFrame() {
    if (!this.animCanvasRef) return;
    const canvas = this.animCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const spriteId = this.currentSpriteId();
    const spritesList = this.spriteService.sprites();
    const sprite = spritesList[spriteId];
    const pal = this.spriteService.palette();

    if (!sprite || pal.length === 0) {
      canvas.width = 64;
      canvas.height = 64;
      ctx.clearRect(0, 0, 64, 64);
      return;
    }

    const scale = this.animScale();
    canvas.width = sprite.width * scale;
    canvas.height = sprite.height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        // Apply H-Flip and V-Flip if set
        const sampleX = sprite.hFlip ? (sprite.width - 1 - x) : x;
        const sampleY = sprite.vFlip ? (sprite.height - 1 - y) : y;
        const colorIdx = this.spriteService.getPixel(spriteId, sampleX, sampleY);

        if (colorIdx > 0 && colorIdx < pal.length) {
          ctx.fillStyle = pal[colorIdx].hex;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }

  // --- Stage Methods ---

  private initStageGrid() {
    this.stageGrid = [];
    for (let r = 0; r < this.stageGridRows; r++) {
      const row: number[] = [];
      for (let c = 0; c < this.stageGridCols; c++) {
        row.push(-1); // -1 = empty
      }
      this.stageGrid.push(row);
    }
  }

  clearStage() {
    this.initStageGrid();
    this.renderStage();
  }

  fillStageWithCurrent() {
    const active = this.spriteService.selectedSpriteIndex();
    for (let r = 0; r < this.stageGridRows; r++) {
      for (let c = 0; c < this.stageGridCols; c++) {
        this.stageGrid[r][c] = active;
      }
    }
    this.renderStage();
  }

  onStageMouseDown(e: MouseEvent) {
    this.isStageDrawing = true;
    this.stampStage(e);
  }

  onStageMouseMove(e: MouseEvent) {
    if (!this.isStageDrawing) return;
    this.stampStage(e);
  }

  private stampStage(e: MouseEvent) {
    if (!this.stageCanvasRef) return;
    const canvas = this.stageCanvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const cellPx = 16 * this.stageScale();
    const col = Math.floor(x / cellPx);
    const row = Math.floor(y / cellPx);

    if (row >= 0 && row < this.stageGridRows && col >= 0 && col < this.stageGridCols) {
      this.stageGrid[row][col] = this.spriteService.selectedSpriteIndex();
      this.renderStage();
    }
  }

  renderStage() {
    if (!this.stageCanvasRef) return;
    const canvas = this.stageCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = this.stageScale();
    const cellPx = 16 * scale;
    canvas.width = this.stageGridCols * cellPx;
    canvas.height = this.stageGridRows * cellPx;

    // Background
    ctx.fillStyle = '#0e131b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= this.stageGridCols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellPx, 0);
      ctx.lineTo(c * cellPx, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= this.stageGridRows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * cellPx);
      ctx.lineTo(canvas.width, r * cellPx);
      ctx.stroke();
    }

    const pal = this.spriteService.palette();
    const spritesList = this.spriteService.sprites();

    for (let r = 0; r < this.stageGridRows; r++) {
      for (let c = 0; c < this.stageGridCols; c++) {
        const spriteId = this.stageGrid[r]?.[c];
        if (spriteId === undefined || spriteId < 0 || spriteId >= spritesList.length) continue;

        const sprite = spritesList[spriteId];
        const startX = c * cellPx;
        const startY = r * cellPx;

        for (let y = 0; y < sprite.height; y++) {
          for (let x = 0; x < sprite.width; x++) {
            const sampleX = sprite.hFlip ? (sprite.width - 1 - x) : x;
            const sampleY = sprite.vFlip ? (sprite.height - 1 - y) : y;
            const colorIdx = this.spriteService.getPixel(spriteId, sampleX, sampleY);

            if (colorIdx > 0 && colorIdx < pal.length) {
              ctx.fillStyle = pal[colorIdx].hex;
              ctx.fillRect(startX + x * scale, startY + y * scale, scale, scale);
            }
          }
        }
      }
    }
  }

  downloadActiveViewImage() {
    let canvas: HTMLCanvasElement | null = null;
    let filename = `sprite-export-${this.spriteService.bankName()}.png`;

    if (this.activeTab() === 0 && this.animCanvasRef) {
      canvas = this.animCanvasRef.nativeElement;
      filename = `sprite-anim-${this.spriteService.bankName()}-#${this.currentSpriteId()}.png`;
    } else if (this.activeTab() === 1 && this.stageCanvasRef) {
      canvas = this.stageCanvasRef.nativeElement;
      filename = `sprite-scene-${this.spriteService.bankName()}.png`;
    }

    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
