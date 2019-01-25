import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { Recommendation } from '../common/recommendation';
import { DataService } from './data.service';
import * as commonVars from '../common/global';

@Injectable({
  providedIn: 'root'
})
export class RecommendationService extends DataService {

  constructor(http: HttpClient) {
    super(commonVars.jsonServerUrl + 'recommendations', http);
  }

  updateOrCreateRecommendations(item: number, user: number, selectedUsers: number[]) {
    if(!selectedUsers) selectedUsers=[];
    console.log("updateOrCreateRecommendations: enter", item, user, selectedUsers);
    //1. Get user recommendations from DB
    return this.getWithProps("user=" + user + "&item=" + item).pipe(
      concatMap((recommsDB: Recommendation[]) => {
        //2. If recommsDB.recommendsTo not in selectedUsers, delete them (in parallel)
        let observables = [];
        console.log("updateOrCreateRecommendations: recommsDB", recommsDB);
        recommsDB.map(rec => {
          if (!selectedUsers.find(sel => sel == rec.recommendsTo)) {
            observables.push(this.delete(rec.id));
            console.log("updateOrCreateRecommendations: add delete", rec.id);
          }
        });
        //3. If selectedUsers not in recommsDB, create them (in parallel)
        selectedUsers.map(sel => {
          if (!recommsDB.find(rec => rec.recommendsTo == sel)) {
            observables.push(this.create({
              "id": 0,
              "item": item,
              "user": user,
              "recommendsTo": sel,
              "date": Date.now()
            }));
            console.log("updateOrCreateRecommendations: add create", sel);
          }
        });
        if (observables.length>0)
          return forkJoin(observables);
        else {
          console.log("updateOrCreateRecommendations: no need to update recommendations");
          return of(recommsDB);
        }
      }
    ));
  }
}