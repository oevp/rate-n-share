import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NotFoundError } from '../common/not-found-error';
import { AppError } from './../common/app-error';
import { BadRequestError } from './../common/bad-request-error';

@Injectable({
  providedIn: 'root'
})

export class DataService {
  headers: HttpHeaders;

  constructor(
    protected url: string,
    protected http: HttpClient
  ) {
    this.headers = new HttpHeaders();
    this.headers = this.headers.set('Content-Type', 'application/json');
  }

  getAll() {
    return this.http.get(this.url).pipe(
      catchError((error: Response) => { return this.handleError(error); }));
  }

  getLast(limit) {
    return this.http.get(this.url + '?_sort=date&_order=desc&_limit=' + limit).pipe(
      catchError((error: Response) => { return this.handleError(error); }));
  }

  get(id) {
    return this.http.get(this.url + '/' + id).pipe(
      catchError((error: Response) => { return this.handleError(error); }));
  }

  getWithProps(props) {
    return this.http.get(this.url + '?' + props).pipe(
      catchError((error: Response) => { return this.handleError(error); }));
  }

  create(resource) {
    return this.http.post(
      this.url,
      resource,
      { headers: this.headers })
      .pipe(
        catchError((error: Response) => { return this.handleError(error); })
      );
  }

  update(resource) {
    return this.http.patch(
      this.url + '/' + resource.id,
      resource,
      { headers: this.headers })
      .pipe(
        catchError((error: Response) => { return this.handleError(error); }));
  }

  delete(id) {
    return this.http.delete(
      this.url + '/' + id,
      { headers: this.headers })
      .pipe(
        catchError((error: Response) => { return this.handleError(error); }));
  }

  protected handleError(error: Response) {
    if (error.status === 400)
      return throwError(new BadRequestError(error));
    if (error.status === 404)
      return throwError(new NotFoundError());
    return throwError(new AppError(error));
  }
}