import { RecommendationService } from './../services/recommendation.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { Item } from '../common/item';
import { NotFoundError } from '../common/not-found-error';
import { Rating } from '../common/rating';
import { User } from '../common/user';
import { DataStorageService } from '../services/datastorage.service';
import { ItemService } from '../services/item.service';
import { RatingService } from '../services/rating.service';
import { RouterExtService } from '../services/routerext.service';
import { AppError } from './../common/app-error';
import { Category } from './../common/category';
import { CategoryService } from './../services/category.service';
import { UserService } from './../services/user.service';
import { Recommendation } from '../common/recommendation';
import * as commonVars from '../common/global';

@Component({
  selector: 'home',
  templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit, OnDestroy {

  //For communication between components
  user: User;
  item: Item;
  rating: Rating;
  category: Category;
  lastLogin: string;

  ratings: { //Array passed to component template
    "id": number,
    "user": string,
    "title": string,
    "author": string,
    "cat": string,
    "rating": number, 
    "date"?: string,
    "review"?: string,
    "itemId"?: number //for item removal
  }[] = [];

  //Arrays to store data in memory to avoid duplicate requests
  categories: Category[] = [];
  items: Item[] = [];
  users: User[] = [];
  //Ratings handling
  ratingsDBMine: Rating[] = [];
  ratingsDBOthers: Rating[] = [];
  ratingsDBAll: Rating[] = [];

  truncateOwnReviewsAt = commonVars.truncateOwnReviewsAt;
  truncateFriendsReviewsAt = commonVars.truncateFriendsReviewsAt;
  
  constructor(
    private ratingService: RatingService,
    private itemService: ItemService,
    private userService: UserService,
    private categoryService: CategoryService,
    private recommendationService: RecommendationService,
    private router: Router,
    private dataStorage: DataStorageService,
    private routerExtService: RouterExtService
  ) {}

  ngOnInit() {
    console.log("Home: init");
    if(!this.dataStorage.user) {
      console.log("Home: user is not authenticated");
      this.router.navigate(['/']);
      return;
    }
    this.user = this.dataStorage.user;
    let previous = this.routerExtService.getPreviousUrl();
    console.log("Home: previous page: ", previous);
    if(previous && previous==='/') {
      this.lastLogin = new Date(+this.user.lastLogin).toLocaleString();
    }
    forkJoin(
      this.categoryService.getAll(),
      this.ratingService.getWithProps("user=" + this.user.id +"&_sort=date&_order=desc&_limit=" + commonVars.ratingsLimitHome),
      this.ratingService.getWithProps("user_ne=" + this.user.id +"&_sort=date&_order=desc&_limit=" + commonVars.ratingsLimitHome)
    ).pipe(
      map(([categories, myRatings, othersRatings]) => {
        this.categories = categories as Category[]; //store categories and ratings for later use
        this.ratingsDBMine = myRatings as Rating[];
        this.ratingsDBOthers = othersRatings as Rating[];
        console.log("Home: retrieved categories", this.categories);
        console.log("Home: retrieved my ratings", this.ratingsDBMine);
        console.log("Home: retrieved others ratings", this.ratingsDBOthers);
        this.ratingsDBAll = this.ratingsDBMine.concat(this.ratingsDBOthers);
      })
    ).subscribe( () => {
      this.getItems();
    });
  }

  getItems() {
    console.log("Home: getItems");
    let observables = [];
    let inserted: number[] = [];
    this.ratingsDBAll.forEach(rating => { //create list of items to retrieve
      if (!inserted.find(el => el == rating.item)) {
        observables.push(this.itemService.get(rating.item));
        inserted.push(rating.item);
      }
    });
    forkJoin(observables).subscribe( items => {
      this.items = items; //store items for later use
      console.log("Home: retrieved items", this.items);
      this.getUsers();
    });
  }

  getUsers() {
    console.log("Home: getUsers");
    let observables = [];
    let inserted: number[] = [];
    this.ratingsDBAll.forEach(rating => { //create list of users to retrieve
      if (!inserted.find(el => el == rating.user)) {
        observables.push(this.userService.get(rating.user));
        inserted.push(rating.user);
      }
    });
    forkJoin(observables).subscribe( users => {
      this.users = users; //store users for later use
      console.log("Home: retrieved users", this.users);

      //Prepare ratings array for template:
      this.ratingsDBAll.forEach(rating => {
        this.ratings.push({
          "id":     rating.id,
          "user":   this.getUser(rating.user) ? this.getUser(rating.user).name : "Null",
          "title":  this.getItem(rating.item) ? this.getItem(rating.item).title : "Null",
          "author": this.getItem(rating.item) ? this.getItem(rating.item).author : "Null",
          "cat":    (this.getItem(rating.item) && this.getCategory(this.getItem(rating.item).cat)) ?
                    this.getCategory(this.getItem(rating.item).cat).name : "Null",
          "rating": rating.rating,
          "review": rating.review,
          "date":   new Date(rating.date).toLocaleString(),
          "itemId": this.getItem(rating.item) ? this.getItem(rating.item).id : null
        });
      });
    });
  }

  ratingComponentClick(clickObj: any): void {
    console.log("Home: ratingComponentClick", clickObj);
    this.ratingService.updateRating(this.ratings[clickObj.itemId].id, clickObj.rating)
      .subscribe((r: Rating) => {
        this.ratings[clickObj.itemId].date = new Date(r.date).toLocaleString();
      },
      (error: AppError) => {
        if (error instanceof NotFoundError)
          alert('Database server problem');
        else throw error;
      }
    );
    this.ratings[clickObj.itemId].rating = clickObj.rating;
  }

  deleteRatingClick(ratingPos: number): void {
    console.log("Home: deleteRatingClick with position:", ratingPos, "and id:", this.ratings[ratingPos].id);
    let item = this.ratings[ratingPos].itemId;
    this.ratingService.delete(this.ratings[ratingPos].id).pipe(
      concatMap(() => {
        console.log("Home: deleteRatingClick: rating deleted:", this.ratings[ratingPos].id);
        this.ratings.splice(ratingPos,1);
        return this.ratingService.getWithProps("item=" + item); //check if other ratings exist for the item
      }),
      concatMap(ratings => {
        if(!ratings || (Object.keys(ratings).length == 0)) {
          console.log("Home: deleteRatingClick: no other ratings, delete item:", item);
          return this.itemService.delete(item);
        }
        console.log("Home: deleteRatingClick: other ratings exist, do not delete item");
        return of(ratings); //If we don't return an Observable we get an error
      }),
      concatMap((ratings) => {
        console.log("Home: deleteRatingClick: getRecomms with user and item", this.user.id, item);
        this.recommendationService.getWithProps("user=" + this.user.id + "&item=" + item)
          .subscribe((recomms: Recommendation[]) => {
            recomms.map(r => {
              this.recommendationService.delete(r.id).subscribe();
            });
          });
        return of(ratings);
      })
    ).subscribe();
  }

  ratingExists(user:number, item:number) {
    return this.ratingService.getWithProps("item=" + item + "&user=" + user);
  }

  reviewClick(ratingPos: number): void {
    console.log("Home: enter reviewClick");
    this.item = new Item();
    this.rating = new Rating();
    this.category = new Category();
    this.item = this.items.find(el => el.id == this.ratings[ratingPos].itemId);
    this.category.name = this.ratings[ratingPos].cat;
    let foundRating = this.ratings.find(r =>
      (r.user==this.user.name && r.itemId==this.item.id)
    );
    if(foundRating) { //item rated by user and present in the ratings array
      this.rating.rating = foundRating.rating;
      this.rating.review = foundRating.review;
    }
    else { //check if item is rated by user even if not present in ratings array
      this.ratingExists(this.user.id, this.item.id)
        .subscribe(rating => {
          console.log("ratingExists returns", rating);
          if(rating && (Object.keys(rating).length > 0)) {
            this.rating.rating = rating[0].rating;
            this.rating.review = rating[0].review;
          }
        });
    }
    this.router.navigate(['/rating']);
  }

  getCategory(id: number): Category {
    return this.categories.find(el => el.id == id);
  }

  getItem(id: number): Item {
    return this.items.find(el => el.id == id);
  }

  getUser(id: number): User {
    return this.users.find(el => el.id == id);
  }

  getObject(id: number, array: Object[]): Object {
    return array.find(el => (el as any).id == id);
  }

  ngOnDestroy() {
    this.dataStorage.user = this.user;
    this.dataStorage.categs = this.categories;
    this.dataStorage.item = this.item;
    this.dataStorage.rating = this.rating;
    this.dataStorage.category = this.category;
  }
}