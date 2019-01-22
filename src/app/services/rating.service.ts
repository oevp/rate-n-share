import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, concatMap } from 'rxjs/operators';
import { DataService } from './data.service';
import * as commonVars from '../common/global';

@Injectable({
  providedIn: 'root'
})
export class RatingService extends DataService {

  constructor(http: HttpClient) {
    super(commonVars.jsonServerUrl + 'ratings', http);
  }

  updateRating(id: number, rating: number, review?: string) {
    let jsonObj = {
      "id": id.toString(),
      "date": Date.now(),
      "rating": rating,
      "review": review
    };
    return this.update(jsonObj)
      .pipe(
        catchError( (error: Response) => { return this.handleError(error); })
      );
  }

  createRating(item: number, user: number, rating: number, review?: string) {
    let jsonObj = {
      "id": 0,
      "item": item,
      "user": user,
      "date": Date.now(),
      "rating": rating,
      "review": review
    };
    return this.create(jsonObj)
      .pipe(
        catchError( (error: Response) => { return this.handleError(error); })
      );
  }

  updateOrCreateRating(item: number, user: number, rating: number, review?: string) {
    return this.getWithProps("item=" + item + "&user=" + user).pipe(
      concatMap(ratings => {
        if(!ratings || (Object.keys(ratings).length == 0)) {
          console.log("updateOrCreateRating: create rating");
          return this.createRating(item, user, rating, review);
        }
        console.log("updateOrCreateRating: fetched ratings", ratings);
        return this.updateRating(ratings[0].id, rating, review);
      })
    );
  }
}