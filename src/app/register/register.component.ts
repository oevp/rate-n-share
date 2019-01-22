import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { User } from '../common/user';
import { UserService } from '../services/user.service';
import { AppError } from './../common/app-error';
import { NotFoundError } from './../common/not-found-error';
import { DataStorageService } from './../services/datastorage.service';

@Component({
  selector: 'register',
  templateUrl: './register.component.html'
})

export class RegisterComponent {

  user: User;
  userExists: boolean;

  constructor(
    private userService: UserService,
    private router: Router,
    private dataStorage: DataStorageService)
  {
    this.user = new User();
  }

  onSubmit() {
    console.log("Register: button clicked", this.user);
    this.userExists = false;
    this.userService.getWithProps("name=" + this.user.name).pipe(
      tap( users => {
        if(users && (Object.keys(users).length > 0)) {
            console.log("Register: user already exists!!");
            this.userExists = true;
        }
        if(!this.userExists) this.createUser();
      })
    ).subscribe(() => {},
      (error: AppError) => {
        if (error instanceof NotFoundError)
          alert('Database server problem');
        else throw error;
      }
    );
  }

  createUser() {
    this.userService.register(this.user.name, this.user.password)
      .subscribe(
        user => {
            this.user = user as User;
            this.router.navigate(['/home']);
        },
        (error: AppError) => {
          if (error instanceof NotFoundError)
            alert('Database server problem');
          else throw error;
        }
      );
  }

  ngOnInit() {
    console.log("Register: init");
  }

  ngOnDestroy() {
    console.log("Register: destroy");
    this.dataStorage.user = this.user;
  }
}