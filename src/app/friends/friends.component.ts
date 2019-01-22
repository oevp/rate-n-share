import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import * as commonVars from '../common/global';
import { Item } from '../common/item';
import { Rating } from '../common/rating';
import { Recommendation } from '../common/recommendation';
import { User } from '../common/user';
import { DataStorageService } from '../services/datastorage.service';
import { ItemService } from '../services/item.service';
import { RatingService } from '../services/rating.service';
import { RecommendationService } from '../services/recommendation.service';
import { Category } from './../common/category';
import { CategoryService } from './../services/category.service';
import { UserService } from './../services/user.service';

@Component({
  selector: 'friends',
  templateUrl: './friends.component.html'
})

export class FriendsComponent implements OnInit, OnDestroy {

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
    "recommendedTo"?: string[],
    "itemId"?: number //for item removal
  }[] = [];

  //Arrays to store data in memory to avoid duplicate requests
  categories: Category[] = [];
  items: Item[] = [];
  users: User[] = [];
  recomms: Recommendation[] = [];
  //Ratings handling
  ratingsDB: Rating[] = [];

  truncateOwnReviewsAt = commonVars.truncateOwnReviewsAt;
  truncateFriendsReviewsAt = commonVars.truncateFriendsReviewsAt;
  
  constructor(
    private ratingService: RatingService,
    private itemService: ItemService,
    private userService: UserService,
    private categoryService: CategoryService,
    private recommendationService: RecommendationService,
    private router: Router,
    private dataStorage: DataStorageService
  ) {}

  ngOnInit() {
    console.log("Home: init");
    if(!this.dataStorage.user) {
      console.log("Home: user is not authenticated");
      this.router.navigate(['/']);
      return;
    }
    this.user = this.dataStorage.user;
    this.categories = this.dataStorage.categs;

    forkJoin(
      //Get categories and recent friends ratings
      this.categoryService.getAll(),
      this.ratingService.getWithProps("user_ne=" + this.user.id +"&_sort=date&_order=desc&_limit=" + commonVars.ratingsLimitFriends)
    ).pipe(
      map(([categories, ratings]) => {
        this.categories = categories as Category[]; //store categories and ratings for later use
        this.ratingsDB = ratings as Rating[];
        console.log("Home: retrieved categories", this.categories);
        console.log("Home: retrieved others ratings", this.ratingsDB);
      })
    ).subscribe(() => {
      this.getItems();
    });
  }

  getItems() {
    console.log("Home: getItems");
    let obsItems = [];
    let inserted: number[] = [];
    this.ratingsDB.forEach(rating => { //create list of items to retrieve
      if (!inserted.find(el => el == rating.item)) {
        obsItems.push(this.itemService.get(rating.item));
        inserted.push(rating.item);
      }
    });
    forkJoin(obsItems).pipe(
      map(items => {
        this.items = items as Item[]; //store items for later use
        console.log("Home: retrieved items", this.items);   
      })).subscribe(() => {
        this.getRecomms();
    });
  }

  getRecomms() {
    console.log("Home: getRecomms");
    let obsRecomms = [];
    this.ratingsDB.forEach(rating => { //create list of recommendations to retrieve
      obsRecomms.push(this.recommendationService.getWithProps("user=" + rating.user + "&item=" + rating.item));
    });
    forkJoin(obsRecomms).pipe(
      map(recomm => {
        //Flatten response
        this.recomms = recomm.reduce(function(a, b) {
          return a.concat(b);
        }, []);
        console.log("Home: retrieved recomms", this.recomms);   
      })).subscribe(() => {
        this.getUsers();
    });
  }

  getUsers() {
    console.log("Home: getUsers");
    let observables = [];
    let inserted: number[] = [];
    this.ratingsDB.forEach(rating => { //create list of users to retrieve
      if (!inserted.find(el => el == rating.user)) {
        observables.push(this.userService.get(rating.user));
        inserted.push(rating.user);
      }
    });
    this.recomms.forEach(recomm => { //add 'recommendsTo' users
      if (!inserted.find(el => el == recomm.recommendsTo)) {
        observables.push(this.userService.get(recomm.recommendsTo));
        inserted.push(recomm.recommendsTo);
      }
    });
    forkJoin(observables).subscribe( users => {
      this.users = users; //store users for later use
      console.log("Home: retrieved users", this.users);

      //Prepare ratings array for template:
      this.ratingsDB.forEach(rating => {
        this.ratings.push({
          "id":     rating.id,
          "user":   this.getUser(rating.user) ? this.getUser(rating.user).name : "Null",
          "title":  this.getItem(rating.item) ? this.getItem(rating.item).title : "Null",
          "author": this.getItem(rating.item) ? this.getItem(rating.item).author : "Null",
          "cat":    (this.getItem(rating.item) && this.getCategory(this.getItem(rating.item).cat)) ?
                    this.getCategory(this.getItem(rating.item).cat).name : "Null",
          "rating": rating.rating,
          "review": rating.review,
          "recommendedTo": this.getRecommendations(rating.item, rating.user),
          "date":   new Date(rating.date).toLocaleString(),
          "itemId": this.getItem(rating.item) ? this.getItem(rating.item).id : null
        });
      });
    });
  }

  getRecommendations(item: number, user: number): string[] {
    console.log("Home: enter getRecommendations", item, user);
    let recs: string[] = [];
    this.recomms.forEach(el=> {
      if(el.user==user && el.item==item) {
        recs.push(this.getUser(el.recommendsTo) ? this.getUser(el.recommendsTo).name : el.recommendsTo.toString());
      }
    });
    return recs;
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