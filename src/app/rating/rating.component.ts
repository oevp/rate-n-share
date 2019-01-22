import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { concatMap } from 'rxjs/operators';
import { Item } from '../common/item';
import { Rating } from '../common/rating';
import { User } from '../common/user';
import { DataStorageService } from '../services/datastorage.service';
import { ItemService } from '../services/item.service';
import { RatingService } from '../services/rating.service';
import { RecommendationService } from '../services/recommendation.service';
import { UserService } from '../services/user.service';
import { Category } from './../common/category';
import { Recommendation } from './../common/recommendation';

@Component({
  selector: 'rating',
  templateUrl: './rating.component.html'
})

export class RatingComponent implements OnInit, OnDestroy {

  user: User;
  categs: Category[];
  item: Item;
  rating: Rating;
  category: Category;
  users: User[];
  ratingAdded: boolean = false;
  selectedUsers: number[];

  constructor(
    private ratingService: RatingService,
    private itemService: ItemService,
    private userService: UserService,
    private recommendationService: RecommendationService,
    private router: Router,
    private dataStorage: DataStorageService
  ) {}

  onSubmit() {
    console.log("Rating: button clicked", this.item, this.rating, this.selectedUsers);
    this.itemService.getOrCreateItem(this.item).pipe(
      concatMap(item => {
        if(item && (Object.keys(item).length > 0)) {
          console.log("Rating: got item:", item);
          this.item=item;
          return this.ratingService.updateOrCreateRating(this.item.id, this.user.id, this.rating.rating, this.rating.review);
        }
      }),
      concatMap(() => {
          return this.recommendationService.updateOrCreateRecommendations(this.item.id, this.user.id, this.selectedUsers);
      })
    ).subscribe(() => {
      this.ratingAdded=true;
      setTimeout(() => {
        this.ratingAdded=false;
      }, 2000);
    });
  }

  onSelectCat(categId: number) {
    console.log("Rating: selected category", categId);
    this.item.cat = +categId;
  }

  onSelectRecom() {
    console.log("Rating: selected recommendations", this.selectedUsers);
  }

  ratingComponentClick(clickObj: any): void {
    console.log("Rating: ratingComponentClick", clickObj);
    this.rating.rating = clickObj.rating;
  }
  
  ngOnInit() {
    console.log("Rating: init");
    if(!this.dataStorage.user) {
      console.log("Rating: user is not authenticated");
      this.router.navigate(['/']);
      return;
    }
    this.user = this.dataStorage.user;
    this.categs = this.dataStorage.categs;
    this.item = this.dataStorage.item ? this.dataStorage.item : new Item();
    this.rating = this.dataStorage.rating ? this.dataStorage.rating : new Rating();
    this.category = this.dataStorage.category ? this.dataStorage.category : new Category();
    this.getUsers();
    if (this.item.id) this.getRecomms();
  }

  getUsers() {
    console.log("Rating: getUsers");
    this.userService.getAll()
      .subscribe((users: User[]) => {;
        this.users = users;
        this.users.splice(users.findIndex(el => el.id === this.user.id), 1); //remove own user
        console.log("Rating: users after removing own", this.users);
      });
  }

  getRecomms() {
    console.log("Rating: getRecomms");
    this.selectedUsers=[];
    this.recommendationService.getWithProps("user=" + this.user.id + "&item=" + this.item.id)
      .subscribe((recomms: Recommendation[]) => {
        let arrayUsers = [];
        recomms.map(r => { arrayUsers.push(r.recommendsTo); });
        this.selectedUsers = arrayUsers;
        console.log("Rating: selected users after filtering", this.selectedUsers);
      });
  }

  ngOnDestroy() {
    console.log("Rating: destroy");
    this.dataStorage.user = this.user;
  }
}