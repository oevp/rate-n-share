import { TemplateRating } from './../common/global';
import { Category } from '../common/category';
import { User } from '../common/user';
import { Injectable } from '@angular/core';
import { Item } from '../common/item';
import { Rating } from '../common/rating';

@Injectable()
export class DataStorageService {

  public user: User;
  public item: Item;
  public rating: Rating;
  public category: Category;
  public ratingDate: string;
  
  public items: Item[];
  public categs: Category[];

  public ratings: TemplateRating[];

  constructor() { }
}