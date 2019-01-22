import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import * as commonVars from '../common/global';
import { Item } from '../common/item';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class ItemService extends DataService {
  
  constructor(http: HttpClient) {
    super(commonVars.jsonServerUrl + 'items', http);
  }

  getOrCreateItem(item: Item) {
    return this.getWithProps("cat=" + item.cat + "&title=" + item.title + "&author=" + item.author).pipe(
      concatMap(items => {
        if(!items || (Object.keys(items).length == 0)) {
          item.id = 0;
          console.log("getOrCreateItem: create item", item);
          return this.create(item);
        }
        console.log("getOrCreateItem: fetched items", items);
        return of(items[0]);
      })
    );
  }
}