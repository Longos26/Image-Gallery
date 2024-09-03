import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ImageGalleryComponent } from './image-gallery/image-gallery.component';
import { HomepageComponent } from './homepage/homepage.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuard } from './auth.guard'; // Correct import
import { UploadingComponent } from './uploading/uploading.component';



const routes: Routes = [
  { path: '', redirectTo: '/homepage', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] }, // Use authGuard
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'gallery', component: ImageGalleryComponent, canActivate: [AuthGuard] }, // Use authGuard
  { path: 'homepage', component: HomepageComponent },
  { path: 'uploading', component: UploadingComponent}

  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }