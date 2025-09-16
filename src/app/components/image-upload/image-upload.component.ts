import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageUploadService } from '../../services/image-upload.service';
import { Customer } from '../../models/customer.interface';
import { CustomerImage, CustomerImagesResponse } from '../../models/upload.interface';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnInit, OnChanges {
  @Input() customer: Customer | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() uploadComplete = new EventEmitter<void>();

  selectedFiles: File[] = [];
  previewUrls: string[] = [];
  isUploading = false;
  uploadProgress = 0;
  error: string | null = null;
  success: string | null = null;

  // Uploaded images properties
  uploadedImages: CustomerImage[] = [];
  isLoadingImages = false;
  isDeletingImage = false;
  deletingImageId: number | null = null;

  // Carousel properties
  currentImageIndex = 0;

  constructor(private imageUploadService: ImageUploadService) {}

  ngOnInit(): void {
    if (this.customer) {
      this.loadUploadedImages();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['customer'] && this.customer && this.isOpen) || (changes['isOpen'] && this.isOpen && this.customer)) {
      this.loadUploadedImages();
    }
  }

  loadUploadedImages(): void {
    if (!this.customer) return;

    this.isLoadingImages = true;
    this.error = null;

    this.imageUploadService.getCustomerImages(this.customer.id).subscribe({
      next: (response: CustomerImagesResponse) => {
        console.log('Loaded images response:', response);
        this.uploadedImages = response.data || [];
        this.isLoadingImages = false;

        // Reset carousel to first image
        this.currentImageIndex = 0;
      },
      error: (error) => {
        console.error('Error loading images:', error);
        this.error = 'Failed to load uploaded images.';
        this.isLoadingImages = false;
      }
    });
  }

  deleteImage(image: CustomerImage): void {
    if (!confirm(`Are you sure you want to delete this image?`)) return;

    this.isDeletingImage = true;
    this.deletingImageId = image.id;

    this.imageUploadService.deleteImage(image.id).subscribe({
      next: () => {
        this.uploadedImages = this.uploadedImages.filter(img => img.id !== image.id);
        this.isDeletingImage = false;
        this.deletingImageId = null;
        this.success = `Image deleted successfully.`;

        // Reset carousel if current image was deleted
        if (this.currentImageIndex >= this.uploadedImages.length) {
          this.currentImageIndex = 0;
        }

        setTimeout(() => this.success = null, 3000);
      },
      error: (error) => {
        console.error('Error deleting image:', error);
        this.error = 'Failed to delete image. Please try again.';
        this.isDeletingImage = false;
        this.deletingImageId = null;
      }
    });
  }

  // File selection & drag-drop
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.addFiles(Array.from(input.files));
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer?.files) this.addFiles(Array.from(event.dataTransfer.files));
  }

  private addFiles(files: File[]): void {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      this.error = 'Please select only image files.';
      return;
    }

    this.selectedFiles = [...this.selectedFiles, ...imageFiles];
    this.generatePreviews();
    this.error = null;
  }

  private generatePreviews(): void {
    this.previewUrls = [];
    this.selectedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  // async uploadImages(): Promise<void> {
  //   if (!this.customer || this.selectedFiles.length === 0) {
  //     this.error = 'Please select at least one image to upload.';
  //     return;
  //   }

  //   this.isUploading = true;
  //   this.error = null;
  //   this.success = null;
  //   this.uploadProgress = 0;

  //   try {
  //     const progressInterval = setInterval(() => {
  //       if (this.uploadProgress < 90) this.uploadProgress += 10;
  //     }, 200);

  //     const response = await this.imageUploadService.uploadCustomerImages(this.customer.id, this.selectedFiles).toPromise();
  //     clearInterval(progressInterval);
  //     this.uploadProgress = 100;
  //     console.log("response:",response);
  //     if (response?.isSuccess) {
  //       this.success = `Successfully uploaded ${this.selectedFiles.length} image(s) for ${this.customer.name}!`;
  //       this.selectedFiles = [];
  //       this.previewUrls = [];
  //       this.loadUploadedImages();

  //       setTimeout(() => {
  //         this.uploadComplete.emit();
  //         this.closeModal();
  //       }, 2000);
  //     } else {
  //       this.error = response?.message || 'Upload failed. Please try again.';
  //     }
  //   } catch (error) {
  //     this.error = error instanceof Error ? error.message : 'Upload failed. Please try again.';
  //   } finally {
  //     this.isUploading = false;
  //   }
  // }
  async uploadImages(): Promise<void> {
  if (!this.customer || this.selectedFiles.length === 0) {
    this.error = 'Please select at least one image to upload.';
    return;
  }

  this.isUploading = true;
  this.error = null;
  this.success = null;
  this.uploadProgress = 0;

  try {
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) this.uploadProgress += 10;
    }, 200);

    const response = await this.imageUploadService
      .uploadCustomerImages(this.customer.id, this.selectedFiles)
      .toPromise()
      .catch((err) => {
        // Catch HTTP errors
        throw err;
      });

    clearInterval(progressInterval);
    this.uploadProgress = 100;

    // Success path
    if (response?.isSuccess) {
      this.success = `Successfully uploaded ${this.selectedFiles.length} image(s) for ${this.customer.name}!`;
      this.selectedFiles = [];
      this.previewUrls = [];
      this.loadUploadedImages();

      setTimeout(() => {
        this.uploadComplete.emit();
        this.closeModal();
      }, 2000);
    } else {
      this.error = response?.message || 'Upload failed. Please try again.';
    }
  } catch (err: any) {
    // Handle 500 or other HTTP errors
    console.error('Upload error:', err);

    // Check if backend returns a message
    if (err?.error?.message) {
      this.error = err.error.message;
    } else if (err?.message) {
      this.error = err.message;
    } else {
      this.error = 'Upload failed. Please try again.';
    }
  } finally {
    this.isUploading = false;
  }
}


  closeModal(): void {
    this.close.emit();
    this.resetForm();
  }

  private resetForm(): void {
    this.selectedFiles = [];
    this.previewUrls = [];
    this.error = null;
    this.success = null;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadedImages = [];
    this.isLoadingImages = false;
    this.isDeletingImage = false;
    this.deletingImageId = null;
    this.currentImageIndex = 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getImageUrl(image: CustomerImage): string {
    if (!image.base64Data) {
      console.warn('No base64 data for image', image.id);
      return '';
    }
    const mimeType = image.mimeType?.trim() || 'image/png';
    return `data:${mimeType};base64,${image.base64Data}`;
  }

  // Carousel methods
  nextImage(): void {
    if (this.uploadedImages.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex + 1) % this.uploadedImages.length;
  }

  prevImage(): void {
    if (this.uploadedImages.length === 0) return;
    this.currentImageIndex = (this.currentImageIndex - 1 + this.uploadedImages.length) % this.uploadedImages.length;
  }

  goToImage(index: number): void {
    this.currentImageIndex = index;
  }
}
