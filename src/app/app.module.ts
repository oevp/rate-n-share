import { RecommendationService } from './services/recommendation.service';
import { CategoryService } from './services/category.service';
import { AppComponent } from './app.component';
import { DataStorageService } from './services/datastorage.service';
import { BrowserModule } from '@angular/platform-browser';
import { AppErrorHandler } from './common/app-error-handler';
import { UserService } from './services/user.service';
import { NgModule, ErrorHandler } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule} from '@angular/forms';
import { RatingComponent } from './rating/rating.component';
import { RegisterComponent } from './register/register.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';
import { DataService } from './services/data.service';
import { Routing } from './app.routing';
import { HomeComponent } from './home/home.component';
import { RouterExtService } from './services/routerext.service';
import { RatingService } from './services/rating.service';
import { ItemService } from './services/item.service';
import { ConfirmEqualValidatorDirective } from './common/confirm-equal-validator.directive';
import { StarsRatingComponent } from './stars-rating/stars-rating.component';
import { SummaryPipe } from './common/summary.pipe';
import { FriendsComponent } from './friends/friends.component';
import { RatingsTableComponent } from './ratings-table/ratings-table.component';
import { OrderModule } from 'ngx-order-pipe';

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    HomeComponent,
    StarsRatingComponent,
    RatingComponent,
    PageNotFoundComponent,
    AppComponent,
    ConfirmEqualValidatorDirective,
    SummaryPipe,
    FriendsComponent,
    RatingsTableComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    Routing,
    OrderModule
  ],
  providers: [
    UserService,
    RatingService,
    ItemService,
    CategoryService,
    RecommendationService,
    DataService,
    DataStorageService,
    RouterExtService,
    { provide: ErrorHandler, useClass: AppErrorHandler }
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
  constructor(){}
}