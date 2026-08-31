import { Component, ElementRef, ViewChild, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SpriteService } from '../../services/sprite.service';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="export-dialog-container">
      <div class="dialog-header">
        <div class="title-group">
          <span class="material-symbols-outlined header-icon">code_blocks</span>
          <h2>Export Sprite Bank</h2>
        </div>
        <button mat-icon-button mat-dialog-close>
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Bank Identifier Config -->
      <div class="config-bar">
        <div class="config-item">
          <label>Bank Identifier:</label>
          <input
            type="text"
            [ngModel]="bankName()"
            (ngModelChange)="bankName.set($event)"
            class="code-input"
          />
        </div>
        <div class="config-meta">
          <span>{{ spriteService.totalSprites() }} entries</span>
          <span>•</span>
          <span>{{ spriteService.formattedMemorySize() }}</span>
        </div>
      </div>

      <!-- Export Format Tabs -->
      <mat-tab-group class="export-tabs">
        <!-- 1. TypeScript -->
        <mat-tab label="TypeScript (.ts)">
          <div class="tab-content">
            <div class="code-actions">
              <span class="file-name">sprite-{{ bankName() }}.ts</span>
              <div class="btn-group">
                <button mat-stroked-button (click)="copyToClipboard(generatedTsCode())">
                  <span class="material-symbols-outlined">content_copy</span>
                  <span>Copy Code</span>
                </button>
                <button mat-flat-button color="primary" (click)="downloadTs()">
                  <span class="material-symbols-outlined">download</span>
                  <span>Download .ts</span>
                </button>
              </div>
            </div>
            <pre class="code-block"><code>{{ generatedTsCode() }}</code></pre>
          </div>
        </mat-tab>

        <!-- 2. C++ Source -->
        <mat-tab label="C++ Source (.cpp / .h)">
          <div class="tab-content">
            <div class="code-actions">
              <span class="file-name">sprite_{{ bankName() }}.cpp & .h</span>
              <div class="btn-group">
                <button mat-stroked-button (click)="copyToClipboard(generatedCppCode().cpp)">
                  <span class="material-symbols-outlined">content_copy</span>
                  <span>Copy .cpp</span>
                </button>
                <button mat-stroked-button (click)="copyToClipboard(generatedCppCode().h)">
                  <span class="material-symbols-outlined">content_copy</span>
                  <span>Copy .h</span>
                </button>
                <button mat-flat-button color="primary" (click)="downloadCpp()">
                  <span class="material-symbols-outlined">download</span>
                  <span>Download C++</span>
                </button>
              </div>
            </div>
            <pre class="code-block"><code>{{ generatedCppCode().h }}\n\n{{ generatedCppCode().cpp }}</code></pre>
          </div>
        </mat-tab>

        <!-- 3. Forth Source -->
        <mat-tab label="Rebel Forth (.fs)">
          <div class="tab-content">
            <div class="code-actions">
              <span class="file-name">sprite-{{ bankName() }}.fs</span>
              <div class="btn-group">
                <button mat-stroked-button (click)="copyToClipboard(generatedForthCode())">
                  <span class="material-symbols-outlined">content_copy</span>
                  <span>Copy Forth</span>
                </button>
                <button mat-flat-button color="primary" (click)="downloadForth()">
                  <span class="material-symbols-outlined">download</span>
                  <span>Download .fs</span>
                </button>
              </div>
            </div>
            <pre class="code-block"><code>{{ generatedForthCode() }}</code></pre>
          </div>
        </mat-tab>

        <!-- 4. PNG Spritesheet Atlas -->
        <mat-tab label="Spritesheet & Atlas">
          <div class="tab-content atlas-tab">
            <div class="atlas-preview-section">
              <div class="preview-box">
                <canvas #atlasCanvas class="atlas-canvas"></canvas>
              </div>
              <div class="atlas-actions">
                <button mat-flat-button color="primary" (click)="downloadSpritesheetPng()">
                  <span class="material-symbols-outlined">image</span>
                  <span>Download {{ bankName() }}.png</span>
                </button>
                <button mat-stroked-button (click)="downloadAtlasJson()">
                  <span class="material-symbols-outlined">data_object</span>
                  <span>Download {{ bankName() }}.json Atlas</span>
                </button>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- 5. Raw Binary .SPR -->
        <mat-tab label="Binary (.SPR)">
          <div class="tab-content binary-tab">
            <div class="binary-info-card">
              <span class="material-symbols-outlined card-icon">description</span>
              <div class="card-details">
                <h3>Rebel SPRT Asset File (.SPR)</h3>
                <p>
                  Conforms strictly to <code>SPRITE-BANK.md</code>: 6-byte <code>'RASPRT'</code> magic tag header + 64-byte 16-color 0xRRGGBB Palette + {{ spriteService.totalSprites() }} Entry Headers + Contiguous 4bpp packed pixel blocks.
                </p>
                <div class="specs-grid">
                  <div class="spec-item">
                    <span class="spec-label">Tag Header:</span>
                    <span class="spec-val">6 Bytes ('RASPRT')</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Palette:</span>
                    <span class="spec-val">64 Bytes (16 x 0xRRGGBB)</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Headers:</span>
                    <span class="spec-val">{{ spriteService.totalSprites() * 4 }} Bytes ({{ spriteService.totalSprites() }} entries)</span>
                  </div>
                  <div class="spec-item">
                    <span class="spec-label">Total File Size:</span>
                    <span class="spec-val highlight">{{ spriteService.totalMemoryBytes() + 6 }} Bytes</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="binary-download-wrapper">
              <button mat-flat-button color="primary" class="big-download-btn" (click)="downloadSpr()">
                <span class="material-symbols-outlined">download</span>
                <span>Download {{ bankName() }}.SPR (Binary)</span>
              </button>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .export-dialog-container {
      width: 920px;
      max-width: 94vw;
      box-sizing: border-box;
      background: var(--sys-surface-container);
      color: var(--sys-on-surface);
      padding: 24px;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--sys-outline-variant);

      h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
        font-family: 'Plus Jakarta Sans', sans-serif;
      }
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 8px;

      .header-icon {
        color: var(--sys-primary);
      }
    }

    .config-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--sys-surface-container-high);
      padding: 8px 14px;
      border-radius: 12px;
      border: 1px solid var(--sys-outline-variant);
      flex-wrap: wrap;
      gap: 8px;
    }

    .config-item {
      display: flex;
      align-items: center;
      gap: 8px;

      label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--sys-primary);
      }
    }

    .code-input {
      background: var(--sys-surface-container-highest);
      border: 1px solid var(--sys-outline-variant);
      color: var(--sys-on-surface);
      font-family: 'Fira Code', monospace;
      font-size: 0.82rem;
      border-radius: 6px;
      padding: 4px 8px;
      outline: none;
      width: 160px;

      &:focus {
        border-color: var(--sys-primary);
      }
    }

    .config-meta {
      font-family: 'Fira Code', monospace;
      font-size: 0.75rem;
      color: var(--sys-on-surface-variant);
      display: flex;
      gap: 6px;
    }

    .tab-content {
      padding-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .code-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .file-name {
      font-family: 'Fira Code', monospace;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--sys-primary);
    }

    .btn-group {
      display: flex;
      gap: 8px;

      button {
        border-radius: 16px !important;
        font-weight: 600;
      }
    }

    .code-block {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Fira Code', monospace;
      font-size: 0.78rem;
      padding: 14px;
      border-radius: 12px;
      max-height: 360px;
      overflow: auto;
      border: 1px solid var(--sys-outline-variant);
      margin: 0;
      white-space: pre;
    }

    .atlas-tab {
      align-items: center;
      padding: 16px 0;
    }

    .atlas-preview-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      width: 100%;
    }

    .preview-box {
      background: #0a0e14;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid var(--sys-outline-variant);
      max-height: 280px;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .atlas-canvas {
      display: block;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
      max-width: 100%;
    }

    .atlas-actions {
      display: flex;
      gap: 12px;
    }

    .binary-tab {
      align-items: center;
      padding: 20px 0;
    }

    .binary-info-card {
      display: flex;
      gap: 16px;
      background: var(--sys-surface-container-high);
      border: 1px solid var(--sys-outline-variant);
      padding: 16px 20px;
      border-radius: 16px;
      max-width: 560px;
      align-items: flex-start;

      .card-icon {
        font-size: 40px;
        color: var(--sys-primary);
      }

      h3 {
        margin: 0 0 6px 0;
        font-size: 1.05rem;
      }

      p {
        margin: 0 0 12px 0;
        font-size: 0.82rem;
        color: var(--sys-on-surface-variant);
        line-height: 1.4;
      }
    }

    .specs-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .spec-item {
      display: flex;
      flex-direction: column;
      background: var(--sys-surface-container);
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--sys-outline-variant);
    }

    .spec-label {
      font-size: 0.65rem;
      color: var(--sys-on-surface-variant);
      font-weight: 600;
    }

    .spec-val {
      font-family: 'Fira Code', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--sys-on-surface);

      &.highlight {
        color: var(--sys-primary);
      }
    }

    .binary-download-wrapper {
      margin-top: 16px;
    }

    .big-download-btn {
      padding: 12px 28px !important;
      border-radius: 24px !important;
      font-size: 0.95rem !important;
      font-weight: 700 !important;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class ExportDialogComponent implements AfterViewInit {
  spriteService = inject(SpriteService);
  snackBar = inject(MatSnackBar);
  dialogRef = inject(MatDialogRef<ExportDialogComponent>);

  bankName = signal<string>(this.spriteService.bankName() || 'rebel_sprites');

  @ViewChild('atlasCanvas') atlasCanvasRef!: ElementRef<HTMLCanvasElement>;

  generatedTsCode = computed(() => {
    return this.spriteService.exportTsSource(this.bankName());
  });

  generatedCppCode = computed(() => {
    return this.spriteService.exportCppSource(this.bankName());
  });

  generatedForthCode = computed(() => {
    return this.spriteService.exportForthSource(this.bankName());
  });

  ngAfterViewInit() {
    setTimeout(() => this.drawAtlasPreview(), 50);
  }

  drawAtlasPreview() {
    if (!this.atlasCanvasRef) return;
    const { canvas } = this.spriteService.exportSpritesheetAtlas(8);
    const target = this.atlasCanvasRef.nativeElement;
    target.width = canvas.width;
    target.height = canvas.height;
    const ctx = target.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }
  }

  copyToClipboard(code: string) {
    navigator.clipboard.writeText(code);
    this.snackBar.open('Code copied to clipboard!', 'Close', { duration: 2500 });
  }

  downloadTs() {
    const code = this.generatedTsCode();
    const blob = new Blob([code], { type: 'text/typescript' });
    this.saveFile(blob, `sprite-${this.bankName()}.ts`);
  }

  downloadCpp() {
    const { cpp, h } = this.generatedCppCode();
    const blobCpp = new Blob([cpp], { type: 'text/plain' });
    const blobH = new Blob([h], { type: 'text/plain' });
    this.saveFile(blobH, `sprite_${this.bankName()}.h`);
    setTimeout(() => this.saveFile(blobCpp, `sprite_${this.bankName()}.cpp`), 100);
  }

  downloadForth() {
    const code = this.generatedForthCode();
    const blob = new Blob([code], { type: 'text/plain' });
    this.saveFile(blob, `sprite-${this.bankName()}.fs`);
  }

  downloadSpritesheetPng() {
    const { canvas } = this.spriteService.exportSpritesheetAtlas(8);
    canvas.toBlob(blob => {
      if (blob) {
        this.saveFile(blob, `${this.bankName()}.png`);
      }
    });
  }

  downloadAtlasJson() {
    const { atlasJson } = this.spriteService.exportSpritesheetAtlas(8);
    const blob = new Blob([atlasJson], { type: 'application/json' });
    this.saveFile(blob, `${this.bankName()}-atlas.json`);
  }

  downloadSpr() {
    const blob = this.spriteService.exportSprBinaryBlob(true);
    this.saveFile(blob, `${this.bankName()}.SPR`);
  }

  private saveFile(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
