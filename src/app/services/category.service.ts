import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DataService } from './data.service';
import * as commonVars from '../common/global';

@Injectable({
  providedIn: 'root'
})
export class CategoryService extends DataService {

  constructor(http: HttpClient) {
    super(commonVars.jsonServerUrl + 'categories', http);
  }
}