import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../user.service';

@Component({
    selector: 'app-homepage',
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {

    images: any[] = [];
    filteredImages: any[] = [];
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
    text: { content: string; x: number; y: number } = { content: 'Sample Text', x: 50, y: 50 }; // Store text and position
    isDragging: boolean = false; // Track dragging state
    dragOffsetX: number = 0; // Offset for dragging
    dragOffsetY: number = 0; // Offset for dragging
    image: any;
    currentImageIndex: number = 0;
    itemActive: number = 0;
    refreshInterval: any;

    constructor(private userService: UserService) { }

    ngOnInit(): void {
        this.fetchImages();
        this.refreshInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
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

    nextSlide(): void {
        this.itemActive = (this.itemActive + 1) % this.images.length;
        this.showSlider();
    }

    prevSlide(): void {
        this.itemActive = (this.itemActive - 1 + this.images.length) % this.images.length;
        this.showSlider();
    }

    selectSlide(index: number): void {
        this.itemActive = index;
        this.showSlider();
    }

    showSlider(): void {
        const items = document.querySelectorAll('.slider .list .item');
        const thumbnails = document.querySelectorAll('.thumbnail .item');

        items.forEach((item, index) => {
            if (index === this.itemActive) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        thumbnails.forEach((thumbnail, index) => {
            if (index === this.itemActive) {
                thumbnail.classList.add('active');
            } else {
                thumbnail.classList.remove('active');
            }
        });

        // Reset the interval
        clearInterval(this.refreshInterval);
        this.refreshInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
    

    // Other existing methods...

    onFileSelected(event: any) {
        this.selectedFile = event.target.files[0];
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
        canvas.addEventListener('mousedown', this.startDragging.bind(this)); // Add event listener for dragging
        canvas.addEventListener('mousemove', this.dragText.bind(this)); // Add event listener for dragging
        canvas.addEventListener('mouseup', this.endDragging.bind(this)); // Add event listener for dragging
    }

    addText(): void {
        if (this.editCanvas) {
            const ctx = this.editCanvas.getContext('2d');
            ctx!.font = '20px Arial';
            ctx!.fillStyle = 'white';
            ctx!.fillText(this.text.content, this.text.x, this.text.y);
        }
    }

    startDragging(event: MouseEvent): void {
        if (this.isTextClicked(event)) {
            this.isDragging = true;
            this.dragOffsetX = event.offsetX - this.text.x;
            this.dragOffsetY = event.offsetY - this.text.y;
        }
    }

    dragText(event: MouseEvent): void {
        if (this.isDragging && this.editCanvas) {
            const ctx = this.editCanvas.getContext('2d');
            const img = new Image();
            img.src = this.editImageUrl!;
            img.onload = () => {
                ctx!.clearRect(0, 0, this.editCanvas!.width, this.editCanvas!.height);
                ctx!.drawImage(img, 0, 0);
                this.text.x = event.offsetX - this.dragOffsetX;
                this.text.y = event.offsetY - this.dragOffsetY;
                this.addText();
            };
        }
    }

    endDragging(): void {
        this.isDragging = false;
    }

    isTextClicked(event: MouseEvent): boolean {
        const textWidth = this.text.content.length * 10; // Approximate text width
        const textHeight = 20; // Approximate text height
        return event.offsetX >= this.text.x && event.offsetX <= this.text.x + textWidth &&
            event.offsetY >= this.text.y - textHeight && event.offsetY <= this.text.y;
    }

    startCrop(event: MouseEvent): void {
        if (this.cropping) {
            this.cropStartX = event.offsetX;
            this.cropStartY = event.offsetY;
        }
    }

    drawCrop(event: MouseEvent): void {
        if (this.cropping && this.editCanvas) {
            const ctx = this.editCanvas.getContext('2d');
            const img = new Image();
            img.src = this.editImageUrl!;
            img.onload = () => {
                ctx!.clearRect(0, 0, this.editCanvas!.width, this.editCanvas!.height);
                ctx!.drawImage(img, 0, 0);
                this.cropEndX = event.offsetX;
                this.cropEndY = event.offsetY;
                ctx!.strokeStyle = 'red';
                ctx!.lineWidth = 2;
                ctx!.strokeRect(this.cropStartX, this.cropStartY, this.cropEndX - this.cropStartX, this.cropEndY - this.cropStartY);
                this.addText(); // Redraw the text
            };
        }
    }

    endCrop(): void {
        this.cropping = false;
    }

    applyCrop(): void {
        if (this.editCanvas && this.cropEndX > 0 && this.cropEndY > 0) {
            const ctx = this.editCanvas.getContext('2d');
            const croppedWidth = this.cropEndX - this.cropStartX;
            const croppedHeight = this.cropEndY - this.cropStartY;
            const imageData = ctx!.getImageData(this.cropStartX, this.cropStartY, croppedWidth, croppedHeight);

            // Create a new canvas to store the cropped image
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;
            croppedCtx!.putImageData(imageData, 0, 0);

            // Update the edit canvas with the cropped image
            this.editCanvas.width = croppedWidth;
            this.editCanvas.height = croppedHeight;
            ctx!.clearRect(0, 0, this.editCanvas.width, this.editCanvas.height);
            ctx!.drawImage(croppedCanvas, 0, 0);

            // Reset crop coordinates
            this.cropStartX = 0;
            this.cropStartY = 0;
            this.cropEndX = 0;
            this.cropEndY = 0;
        }
    }

    downloadEditedImage(): void {
        if (this.editCanvas) {
            const link = document.createElement('a');
            link.href = this.editCanvas.toDataURL('image/jpeg');
            link.download = 'edited-image.jpg';
            link.click();
        }
    }

    resetCrop(): void {
        this.cropStartX = 0;
        this.cropStartY = 0;
        this.cropEndX = 0;
        this.cropEndY = 0;

        // Redraw the original image
        this.initializeCanvas();
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: Event): void {
        this.updateImageSize();
    }

    updateImageSize(): void {
        const screenWidth = window.innerWidth;

        if (screenWidth < 600) {
            this.imageWidth = 100; // Smaller image width for mobile
            this.imageHeight = 150; // Smaller image height for mobile
        } else {
            this.imageWidth = 200; // Default image width for larger screens
            this.imageHeight = 300; // Default image height for larger screens
        }
    }

    onSearch(): void {
      const query = this.searchQuery.toLowerCase();
      this.filteredImages = this.images.filter(image =>
          image.alt.toLowerCase().includes(query)
      );
    }
  
    openModal(imageUrl: string): void {
        this.image = imageUrl;
        const modal = document.getElementById("modal");
        if (modal) {
            modal.style.display = "block";
        }
    }

    closeModal(): void {
        const modal = document.getElementById("modal");
        if (modal) {
            modal.style.display = "none";
        }
    }
}
