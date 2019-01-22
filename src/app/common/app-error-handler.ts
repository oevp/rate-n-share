import { ErrorHandler } from '@angular/core';

export class AppErrorHandler implements ErrorHandler {
    handleError(error) { //we must implement it
        alert('Unexpected error ocurred');
        console.log(error);
    }
}