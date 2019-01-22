import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { AppError } from '../common/app-error';
import { NotFoundError } from '../common/not-found-error';
import { User } from '../common/user';
import { DataStorageService } from '../services/datastorage.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit, OnDestroy {
  
  user: User;
  invalidLogin: boolean = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private dataStorage: DataStorageService
  ) {
    this.user = new User();
  }

  onSubmit() {
    console.log("Login: button clicked", this.user);
    this.userService.getUser(this.user.name, this.user.password).pipe(
      tap(user => {
        if(user && (Object.keys(user).length === 0)) {
          this.invalidLogin = true;
          return;
        }
        this.user = user[0];
        this.updateLoginDate(); //Update lastLogin in DB
        this.router.navigate(['/home']);
      })
    ).subscribe(() => {},
      (error: AppError) => {
        if (error instanceof NotFoundError)
          alert('Database server problem');
        else throw error;
      }
    );
  }

  updateLoginDate() {
    console.log("Login: updateLoginDate");
    this.userService.updateLastLogin(this.user.id).subscribe(
      data => { },
      (error: AppError) => {
        if (error instanceof NotFoundError)
          alert('Database server problem');
        else throw error;
      }
    );
  }

  ngOnInit() {
    console.log("Login: init");
  }

  ngOnDestroy() {
    console.log("Login: destroy");
    this.dataStorage.user = this.user;
  }
}