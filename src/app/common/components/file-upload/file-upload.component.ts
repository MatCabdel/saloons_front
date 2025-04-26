import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  styleUrl: './file-upload.component.scss',
})
export class FileUploadComponent {
  fileName: string = '';
  @Input() imageUrl: SafeUrl | string | null = null;
  @Output() fileEmitter = new EventEmitter<{ file: File; fileName: string }>();

  http = inject(HttpClient);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files?.length) {
      return;
    }
    const file = files[0];
    this.fileName = file.name;
    this.fileEmitter.emit({ file, fileName: this.fileName });
    this.imageUrl = URL.createObjectURL(file);
  }
}
