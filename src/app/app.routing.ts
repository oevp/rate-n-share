import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { RatingComponent } from './rating/rating.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { FriendsComponent } from './friends/friends.component';

const appRoutes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'home', component: HomeComponent },
    { path: 'rating', component: RatingComponent },
    { path: 'friends', component: FriendsComponent },
    { path: '**', component: PageNotFoundComponent }
  ];

export const Routing = RouterModule.forRoot(appRoutes);
