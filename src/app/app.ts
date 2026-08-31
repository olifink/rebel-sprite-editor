import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HeaderComponent } from './components/header/header.component';
import { SpriteListComponent } from './components/sprite-list/sprite-list.component';
import { PixelEditorComponent } from './components/pixel-editor/pixel-editor.component';
import { SpriteSandboxComponent } from './components/sprite-sandbox/sprite-sandbox.component';
import { ExportDialogComponent } from './components/export-dialog/export-dialog.component';
import { SpriteService } from './services/sprite.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    HeaderComponent,
    SpriteListComponent,
    PixelEditorComponent,
    SpriteSandboxComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  spriteService = inject(SpriteService);
  dialog = inject(MatDialog);
  snackBar = inject(MatSnackBar);

  isDraggingFile = signal<boolean>(false);
  isDarkMode = signal<boolean>(true);
  isSandboxMaximized = signal<boolean>(false);

  toggleTheme() {
    this.isDarkMode.set(!this.isDarkMode());
    if (this.isDarkMode()) {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
  }

  openExportDialog() {
    this.dialog.open(ExportDialogComponent, {
      panelClass: 'm3-dialog-panel',
      maxWidth: '95vw',
      width: '920px',
      autoFocus: false
    });
  }

  onFileLoaded(message: string) {
    this.snackBar.open(message, 'Dismiss', { duration: 3500 });
  }

  // --- Global Drag and Drop for .SPR files ---

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight) {
      this.isDraggingFile.set(false);
    }
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as ArrayBuffer;
        if (result) {
          const success = this.spriteService.loadSprBinary(result);
          if (success) {
            const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            this.spriteService.bankName.set(fileNameWithoutExt);
            this.onFileLoaded(`Loaded binary sprite bank ${file.name} (${result.byteLength} bytes)`);
          } else {
            this.onFileLoaded(`Failed to load ${file.name}: invalid sprite bank format`);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }
}
