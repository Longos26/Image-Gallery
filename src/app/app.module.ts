import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AuthGuard } from './auth.guard'; // Import the authGuard
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomepageComponent } from './homepage/homepage.component';
import { ProfileComponent } from './profile/profile.component';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { UploadingComponent } from './uploading/uploading.component';



@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    FooterComponent,
    ImageGalleryComponent,
    LoginComponent,
    RegisterComponent,
    HomepageComponent,
    ProfileComponent,
    UploadingComponent,
   
    
    
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ButtonModule,
    MenubarModule,
    InputTextModule,
    CardModule,
    NgxDropzoneModule
  ],
  providers: [{ provide: 'authGuard', useValue: AuthGuard }], // Provide the authGuard
  bootstrap: [AppComponent]
})
export class AppModule { }