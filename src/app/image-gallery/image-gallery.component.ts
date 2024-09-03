import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PrimeIcons, MenuItem } from 'primeng/api';
import { UserService } from '../user.service';

@Component({
  selector: 'app-image-gallery',
  templateUrl: './image-gallery.component.html',
  styleUrls: ['./image-gallery.component.css']
})
export class ImageGalleryComponent implements OnInit {
[x: string]: any;
  menuItems: MenuItem[] | undefined;
  images: { id: number, url: string, alt: string }[] = [];
  filteredImages: { id: number, url: string, alt: string }[] = [];
  selectedFile: File | null = null;
  searchQuery: string = '';
  imageWidth: number = 200; // Default image width
  imageHeight: number = 300; // Default image height
  showScaleSlider: boolean = false;
  showUploadModal: boolean = false;
  showEditModal: boolean = false;
  customFileName: string | null = null;
  editImageUrl: string | null = null;
  editCanvas: HTMLCanvasElement | null = null;
  cropping: boolean = false;
  cropStartX: number = 0;
  cropStartY: number = 0;
  cropEndX: number = 0;
  cropEndY: number = 0;
  activeCategory: string = 'all';
  
  text: { content: string; x: number; y: number } = { content: 'Sample Text', x: 50, y: 50 }; // Store text and position
  isDragging: boolean = false; // Track dragging state
  dragOffsetX: number = 0; // Offset for dragging
  dragOffsetY: number = 0; // Offset for dragging
  image: any;

  constructor( private userService: UserService) { }

  ngOnInit(): void {
    this.fetchImages();
  }

  fetchImages(): void {
    this.userService.getImagesByUniqueId().subscribe(data => {
      console.log('Fetched images:', data);
      this.images = data.map((image: { id: any; url: any; alt: any; }) => ({
        id: image.id,
        url: image.url,
        alt: image.alt
      }));
      this.filteredImages = this.images; // Initialize filtered images
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  onUpload(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('image', this.selectedFile!); // Non-null assertion

      this.userService.uploadImageWithId(formData).subscribe(response => {
        console.log(response);
        this.fetchImages();
      }, error => {
        console.error(error);
      });
    }
  }

  async checkFileName(fileName: string): Promise<string> {
    const existingFileNames = this.images.map(image => image.url.split('/').pop()!);
    let baseFileName = fileName.split('.').slice(0, -1).join('.');
    const fileExtension = fileName.split('.').pop();
    let uniqueFileName = fileName;
    let counter = 1;

    while (existingFileNames.includes(uniqueFileName)) {
      uniqueFileName = `${baseFileName}(${counter}).${fileExtension}`;
      counter++;
    }

    return uniqueFileName;
  }

  onDelete(imageId: number): void {
    this.userService.deleteImage(imageId.toString()).subscribe(response => {
      console.log('Image deleted successfully:', response);
      this.fetchImages();
    }, error => {
      console.error('Error deleting image:', error);
    });
  }

  onEdit(imageId: number): void {
    console.log('Edit image with ID:', imageId);
    const image = this.images.find(image => image.id === imageId);
    if (image) {
      this.editImageUrl = image.url;
      this.showEditModal = true;
      setTimeout(() => {
        this.initializeCanvas();
      }, 100); // Delay to ensure modal is rendered
    }
  }

  initializeCanvas(): void {
    const canvas = document.getElementById('editCanvas') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = this.editImageUrl!;
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      this.addText(); // Draw initial text
    };
    this.editCanvas = canvas;

    // Add event listeners for cropping
    canvas.addEventListener('mousedown', this.startCrop.bind(this));
    canvas.addEventListener('mousemove', this.drawCrop.bind(this));
    canvas.addEventListener('mouseup', this.endCrop.bind(this));

    // Add event listeners for dragging
    canvas.addEventListener('mousedown', this.startDrag.bind(this));
    canvas.addEventListener('mousemove', this.dragText.bind(this));
    canvas.addEventListener('mouseup', this.endDrag.bind(this));
  }

  startCrop(event: MouseEvent): void {
    this.cropping = true;
    this.cropStartX = event.offsetX;
    this.cropStartY = event.offsetY;
  }

  drawCrop(event: MouseEvent): void {
    if (!this.cropping) return;
    const canvas = this.editCanvas!;
    const ctx = canvas.getContext('2d')!;
    this.cropEndX = event.offsetX;
    this.cropEndY = event.offsetY;

    // Redraw the image
    const img = new Image();
    img.src = this.editImageUrl!;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw the cropping rectangle
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.strokeRect(this.cropStartX, this.cropStartY, this.cropEndX - this.cropStartX, this.cropEndY - this.cropStartY);
    };
  }

  endCrop(): void {
    this.cropping = false;
  }

  applyCrop(): void {
    if (!this.editCanvas) return;
    const canvas = this.editCanvas;
    const ctx = canvas.getContext('2d')!;
    const width = this.cropEndX - this.cropStartX;
    const height = this.cropEndY - this.cropStartY;
    const imageData = ctx.getImageData(this.cropStartX, this.cropStartY, width, height);
    canvas.width = width;
    canvas.height = height;
    ctx.putImageData(imageData, 0, 0);
  }

  addText(): void {
    const ctx = this.editCanvas?.getContext('2d');
    if (ctx) {
      ctx.font = '30px Arial';
      ctx.fillStyle = 'red';
      ctx.fillText(this.text.content, this.text.x, this.text.y);
    }
  }

  startDrag(event: MouseEvent): void {
    const canvas = this.editCanvas!;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const ctx = this.editCanvas?.getContext('2d');
    if (!ctx) return;
    // Check if the mouse is over the text
    if (mouseX >= this.text.x && mouseX <= this.text.x + ctx.measureText(this.text.content).width &&
        mouseY >= this.text.y - 30 && mouseY <= this.text.y) {
      this.isDragging = true;
      this.dragOffsetX = mouseX - this.text.x;
      this.dragOffsetY = mouseY - this.text.y;
    }
  }

  dragText(event: MouseEvent): void {
    if (!this.isDragging) return;
    const canvas = this.editCanvas!;
    const rect = canvas.getBoundingClientRect();
    this.text.x = event.clientX - rect.left - this.dragOffsetX;
    this.text.y = event.clientY - rect.top - this.dragOffsetY;

    // Redraw the canvas
    this.redrawCanvas();
  }

  endDrag(): void {
    this.isDragging = false;
  }

  redrawCanvas(): void {
    const ctx = this.editCanvas?.getContext('2d');
    const img = new Image();
    img.src = this.editImageUrl!;
    img.onload = () => {
      ctx?.clearRect(0, 0, this.editCanvas!.width, this.editCanvas!.height);
      ctx?.drawImage(img, 0, 0);
      this.addText(); // Redraw the text
    };
  }

  saveEditedImage(): void {
    const editedImage = this.editCanvas?.toDataURL('image/png');
    if (editedImage) {
      const link = document.createElement('a');
      link.href = editedImage;
      link.download = 'edited_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showEditModal = false;
    }
  }

  closeEditModal(): void {
    this.showEditModal = false;
  }

 
  onDownload(imageId: number): void {
    this.userService.downloadImage(imageId).subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image_${imageId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, error => {
      console.error('Download failed', error);
    });
  }

  openModal(imageUrl: string): void {
    const modal = document.getElementById("myModal") as HTMLElement;
    const modalImg = document.getElementById("img01") as HTMLImageElement;
    modal.style.display = "block";
    modalImg.src = imageUrl;
  }

  onSearch(): void {
    this.filteredImages = this.images.filter(image => 
      image.alt.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  onScaleChange(event: any): void {
    const value = Number(event.target.value);
    this.imageWidth = value;
    this.imageHeight = value * 1.5; // Adjust height to be 1.5 times the width
  }

  toggleScaleSlider(): void {
    this.showScaleSlider = !this.showScaleSlider;
  }

  toggleUploadModal(): void {
    this.showUploadModal = !this.showUploadModal;
  }

  closeUploadModal(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showUploadModal = false;
    }
  }

  closeScaleSlider(event: Event): void {
    if ((event.target as HTMLElement).classList.contains('dropdown')) {
      this.showScaleSlider = false;
    }
  }

  closeModal(event?: Event): void {
    if (!event || (event.target as HTMLElement).classList.contains('modal')) {
      // Close the image modal
      const modal = document.getElementById('myModal');
      if (modal) {
        modal.style.display = 'none';
      }
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.resize-button-container')) {
      this.showScaleSlider = false;
    }
  }

  filterCategory(category: string): void {
    this.activeCategory = category;
    if (category.toLowerCase() === 'all') {
      this.filteredImages = this.images;
    } else {
      const lowerCaseCategory = category.toLowerCase();
      this.filteredImages = this.images.filter(image => {
        const imageName = image.url.toLowerCase();
        const imageExtension = imageName.split('.').pop();
        return imageName.includes(lowerCaseCategory) || imageExtension === lowerCaseCategory;
      });
    }
  }
}
