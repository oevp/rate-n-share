import { Injectable } from '@angular/core';
import { RoutesRecognized, Router } from '@angular/router';
import { filter, pairwise } from 'rxjs/operators';

 /** A router wrapper, adding extra functions. */
@Injectable()
export class RouterExtService {

  private previousUrl: string = undefined;

  constructor(private router : Router) {
    this.router.events
        .pipe(filter(
            (event: any) => event instanceof RoutesRecognized),
            pairwise()
        )
        .subscribe((event: any) => {
            this.previousUrl=event[0].urlAfterRedirects;
        }
    );
  }

  public getPreviousUrl() {
    return this.previousUrl;
  }
}