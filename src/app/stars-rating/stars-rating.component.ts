import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'stars-rating',
  templateUrl: './stars-rating.component.html',
  styleUrls: ['./stars-rating.component.css']
})

export class StarsRatingComponent implements OnInit {
  @Input() rating: number;
  @Input() ratingId: number;
  @Input() disable: boolean;
  @Output() ratingClick: EventEmitter<any> = new EventEmitter<any>();

  inputName: string;

  ngOnInit() {
    this.inputName = this.ratingId + '_rating';
  }

  onClick(rating: number): void {
    this.rating = rating;
    this.ratingClick.emit({
      ratingId: this.ratingId,
      rating: rating
    })
  }
}