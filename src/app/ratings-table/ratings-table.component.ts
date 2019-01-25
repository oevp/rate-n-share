import { ItemService } from './../services/item.service';
import { Component, OnInit, Input } from '@angular/core';
import { TemplateRating } from '../common/global';
import { DataStorageService } from '../services/datastorage.service';
import { Item } from '../common/item';
import { Rating } from '../common/rating';
import { Category } from '../common/category';
import { Router } from '@angular/router';
import { User } from '../common/user';
import { RatingService } from '../services/rating.service';
import { concatMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { RecommendationService } from '../services/recommendation.service';
import { Recommendation } from '../common/recommendation';
import { AppError } from '../common/app-error';
import { NotFoundError } from '../common/not-found-error';
import * as commonVars from '../common/global';
import { OrderPipe } from 'ngx-order-pipe';

@Component({
  selector: 'ratings-table',
  templateUrl: './ratings-table.component.html'
})

export class RatingsTableComponent implements OnInit {

  @Input()
  ownRatings: boolean;
  
  user: User;
  ratings: TemplateRating[] = [];
  items: Item[] = [];

  truncateOwnReviewsAt = commonVars.truncateOwnReviewsAt;
  truncateFriendsReviewsAt = commonVars.truncateFriendsReviewsAt;

  //Columns sorting
  order: string = '';
  reverse: boolean = false;

  constructor(
    private ratingService: RatingService,
    private itemService: ItemService,
    private recommendationService: RecommendationService,
    private dataStorage: DataStorageService,
    private router: Router,
    private orderPipe: OrderPipe
  ) { }

  ngOnInit() {
    console.log("RatingsTable: init");
    this.user = this.dataStorage.user;
    //this.ratings = this.dataStorage.ratings;
    this.ratings = this.orderPipe.transform(this.dataStorage.ratings, 'title');
    this.items = this.dataStorage.items;
  }

  reviewClick(ratingId: number): void {
    console.log("RatingsTable: enter reviewClick with id", ratingId);
    this.dataStorage.item = new Item();
    this.dataStorage.rating = new Rating();
    this.dataStorage.category = new Category();
    let ratingInArray = this.ratings.find(el => el.id == ratingId);
    this.dataStorage.item = this.items.find(el => el.id == ratingInArray.itemId);
    this.dataStorage.category.name = ratingInArray.cat;
    let foundRating = this.ratings.find(r =>
      (r.user==this.user.name && r.itemId==this.dataStorage.item.id)
    );
    if(foundRating) { //item rated by user and present in the ratings array
      this.dataStorage.rating.rating = foundRating.rating;
      this.dataStorage.rating.review = foundRating.review;
      this.dataStorage.ratingDate = foundRating.date;
    }
    else { //check if item is rated by user even if not present in ratings array
      this.ratingExists(this.user.id, this.dataStorage.item.id)
        .subscribe(rating => {
          if(rating && (Object.keys(rating).length > 0)) {
            this.dataStorage.rating.rating = rating[0].rating;
            this.dataStorage.rating.review = rating[0].review;
            this.dataStorage.ratingDate = rating[0].date;
          }
        });
    }
    this.router.navigate(['/rating']);
  }

  deleteRatingClick(ratingId: number): void {
    console.log("RatingsTable: deleteRatingClick with id:", ratingId);
    let indexInArray = this.ratings.findIndex(el => el.id == ratingId);
    let ratingInArray = this.ratings[indexInArray];
    let itemId = ratingInArray.itemId;
    this.ratingService.delete(ratingInArray.id).pipe(
      concatMap(() => {
        console.log("RatingsTable: deleteRatingClick: rating deleted:", ratingInArray.id);
        this.ratings.splice(indexInArray,1);
        return this.ratingService.getWithProps("item=" + itemId); //check if other ratings exist for the item
      }),
      concatMap(ratings => {
        if(!ratings || (Object.keys(ratings).length == 0)) {
          console.log("RatingsTable: deleteRatingClick: no other ratings, delete item:", itemId);
          return this.itemService.delete(itemId);
        }
        console.log("RatingsTable: deleteRatingClick: other ratings exist, do not delete item");
        return of(ratings); //If we don't return an Observable we get an error
      }),
      concatMap((ratings) => {
        console.log("RatingsTable: deleteRatingClick: getRecomms with user and item", this.user.id, itemId);
        this.recommendationService.getWithProps("user=" + this.user.id + "&item=" + itemId)
          .subscribe((recomms: Recommendation[]) => {
            recomms.map(r => {
              this.recommendationService.delete(r.id).subscribe();
            });
          });
        return of(ratings);
      })
    ).subscribe();
  }

  starsRatingComponentClick(clickObj: any): void {
    console.log("RatingsTable: starsRatingComponentClick", clickObj);
    let indexInArray = this.ratings.findIndex(el => (el.id == clickObj.ratingId) && (el.user==this.user.name));
    this.ratingService.updateRating(clickObj.ratingId, clickObj.rating)
      .subscribe((r: Rating) => {
        this.ratings[indexInArray].date = new Date(r.date).toLocaleString();
      },
      (error: AppError) => {
        if (error instanceof NotFoundError)
          alert('Database server problem');
        else throw error;
      }
    );
    this.ratings[indexInArray].rating = clickObj.rating;
  }
  
  ratingExists(user:number, item:number) {
    return this.ratingService.getWithProps("item=" + item + "&user=" + user);
  }

  setOrder(value: string) {
    console.log("setOrder: value",value);
    if (this.order===value) {
      this.reverse=!this.reverse;
    }
    this.order=value;
  }
}