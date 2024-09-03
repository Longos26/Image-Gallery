import { Component, OnInit, HostListener } from '@angular/core';
import { UserService } from '../user.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  username: string | null = null;
  unique_id: string | null = null;
  showUploadModal: boolean = false;
  selectedFile: File | null = null;
  customFileName: string | null = null;
  images: any[] = [];
  filteredImages: any[] = [];
  searchQuery: string = '';
  showEditModal: boolean = false;
  editImageUrl: string | null = null;
  editCanvas: HTMLCanvasElement | null = null;
  cropping: boolean = false;
  cropStartX: number = 0;
  cropStartY: number = 0;
  cropEndX: number = 0;
  cropEndY: number = 0;
  text: { content: string; x: number; y: number } = { content: 'Sample Text', x: 50, y: 50 };
  isDragging: boolean = false;
  dragOffsetX: number = 0;
  dragOffsetY: number = 0;
  description: any;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.currentUsername.subscribe(name => this.username = name);
    this.userService.currentUniqueID.subscribe(id => {
      this.unique_id = id;
      if (this.unique_id) {
        this.fetchImages();
         this.fetchImages();
      } else {
        console.error('Unique ID is null');
      }
    });
  }

  fetchImages(): void {
    this.userService.getImagesByUniqueId().subscribe(data => {
      this.images = data;
      this.filteredImages = this.images; // Initialize filtered images
    }, error => {
      console.error('Error fetching images:', error);
    });
  }


  onSearch(): void {
    this.filteredImages = this.images.filter(image =>
      image.alt.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  onDelete(imageId: number): void {
    this.userService.deleteImage(imageId.toString()).subscribe(response => {
      console.log('Image deleted successfully:', response);
      this.fetchImages();
    }, error => {
      console.error('Error deleting image:', error);
    });
  }

  toggleUploadModal() {
    this.showUploadModal =!this.showUploadModal;
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

    // Remove existing event listeners before adding new ones
    canvas.removeEventListener('mousedown', this.startCrop.bind(this));
    canvas.removeEventListener('mousemove', this.drawCrop.bind(this));
    canvas.removeEventListener('mouseup', this.endCrop.bind(this));
    canvas.removeEventListener('mousedown', this.startDrag.bind(this));
    canvas.removeEventListener('mousemove', this.dragText.bind(this));
    canvas.removeEventListener('mouseup', this.endDrag.bind(this));

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

  

  closeUploadModal(event: Event) {
    if ((event.target as HTMLElement).classList.contains('modal')) {
      this.showUploadModal = false;
      this.customFileName = ''; 
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.customFileName = this.selectedFile? this.selectedFile.name : null;
  }

  async checkFileName(fileName: string): Promise<string> {
    const existingFileNames = this.images.map(image => image.url.split('/').pop());
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
 
  onUpload() {
    if (this.selectedFile && this.unique_id) {
      const formData = new FormData();
      formData.append('image', this.selectedFile, this.customFileName || this.selectedFile.name);
      formData.append('unique_id', this.unique_id);
  
      this.userService.uploadImageWithId(formData).subscribe(response => {
        console.log('Upload successful', response);
        this.showUploadModal = false;
        this.selectedFile = null; // Clear the selected file
        this.fetchImages(); 
      }, error => {
        console.error('Upload failed', error);
      });
    } else {
      console.error('Selected file or Unique ID is not available');
    }
  }

  openModal(imageUrl: string) {
    const modal = document.getElementById("myModal") as HTMLElement;
    const modalImg = document.getElementById("img01") as HTMLImageElement;
    modal.style.display = "block";
    modalImg.src = imageUrl;
  }

  closeModal(event?: Event) {
    if (!event || (event.target as HTMLElement).classList.contains('modal')) {
      // Close the image modal
      const modal = document.getElementById('myModal');
      if (modal) {
        modal.style.display = 'none';
      }
    }
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

  
}

  

