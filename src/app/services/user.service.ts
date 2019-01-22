import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { DataService } from './data.service';
import * as commonVars from '../common/global';

@Injectable({
  providedIn: 'root'
})
export class UserService extends DataService {

  constructor(http: HttpClient) {
    super(commonVars.jsonServerUrl + 'users', http);
  }

  getUser(username: string, password: string) {
    console.log("UserService: enter getUser with " + username + " and " + password);
    return this.http.get(this.url + "?name=" + username + "&password=" + password).pipe(
      catchError( (error: Response) => { return this.handleError(error); }));
  }

  updateLastLogin(id: number) {
    console.log("UserService: enter updateLastLogin with id", id);
    let jsonObj = {
      "id": id.toString(),
      "lastLogin": Date.now()
    };
    return this.update(jsonObj)
      .pipe(
        catchError( (error: Response) => { return this.handleError(error); })
      );
  }

  register(username: string, password: string) {
    console.log("UserService: enter register with user: " + username + ", password: " + password);
    let jsonObj = {
      "id": 0,
      "name": username,
      "password": password,
      "lastLogin": Date.now()
    };
    return this.create(jsonObj)
      .pipe(
        catchError( (error: Response) => { return this.handleError(error); })
      );
  }
}