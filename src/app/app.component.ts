import { Component } from '@angular/core';
import { RouterExtService } from './services/routerext.service';

@Component({
  selector: 'app',
  templateUrl: './app.component.html'
})

export class AppComponent {
  constructor(private routerExtService: RouterExtService) { }
}