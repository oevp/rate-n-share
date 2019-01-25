import { TemplateRating } from './../common/global';
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

  ratings: TemplateRating[] = [];

  //Arrays to store data in memory to avoid duplicate requests
  categories: Category[] = [];
  items: Item[] = [];
  users: User[] = [];
  recomms: Recommendation[] = [];
  //Ratings handling
  ratingsDB: Rating[] = [];
  
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
    console.log("Friends: init");
    if(!this.dataStorage.user) {
      console.log("Friends: user is not authenticated");
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
        console.log("Friends: retrieved categories", this.categories);
        console.log("Friends: retrieved others ratings", this.ratingsDB);
      })
    ).subscribe(() => {
      this.getItems();
    });
  }

  getItems() {
    console.log("Friends: getItems");
    let obsItems = [];
    let inserted: number[] = [];
    this.ratingsDB.forEach(rating => { //create list of items to retrieve
      if (!inserted.find(el => el == rating.item)) {
        obsItems.push(this.itemService.get(rating.item));
        inserted.push(rating.item);
      }
    });
    forkJoin(obsItems).subscribe( items => {
      this.items = items; //store items for later use
      console.log("Home: retrieved items", this.items);
      this.dataStorage.items = this.items;
      this.getRecomms();
    });
  }

  getRecomms() {
    console.log("Friends: getRecomms");
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
        console.log("Friends: retrieved recomms", this.recomms);   
      })).subscribe(() => {
        this.getUsers();
    });
  }

  getUsers() {
    console.log("Friends: getUsers");
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
      console.log("Friends: retrieved users", this.users);

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
      this.dataStorage.ratings = this.ratings;
    });
  }

  getRecommendations(item: number, user: number): string[] {
    let recs: string[] = [];
    this.recomms.forEach(el=> {
      if(el.user==user && el.item==item) {
        recs.push(this.getUser(el.recommendsTo) ? this.getUser(el.recommendsTo).name : el.recommendsTo.toString());
      }
    });
    return recs;
  }

  addRatingClick() {
    console.log("Friends: addRatingClick");
    this.dataStorage.item = new Item();
    this.dataStorage.rating = new Rating();
    this.dataStorage.category = new Category();
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
    console.log("Friends: destroy");
    this.dataStorage.user = this.user;
    this.dataStorage.categs = this.categories;
  }
}