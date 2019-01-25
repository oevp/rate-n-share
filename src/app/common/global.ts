export const jsonServerUrl = 'http://localhost:3000/';

export const truncateOwnReviewsAt = 20;
export const truncateFriendsReviewsAt = 25;

export const ratingsLimitHome = 6;
export const ratingsLimitFriends = 20;

export interface TemplateRating { //Arrays used in ratings templates
    "id": number,
    "user": string,
    "title": string,
    "author": string,
    "cat": string,
    "rating": number, 
    "date"?: string,
    "review"?: string,
    "recommendedTo"?: string[],
    "itemId"?: number //for item removal
}