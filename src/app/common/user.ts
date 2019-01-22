export class User {
    constructor(
        public id?: number,
        public name?: string,
        public password?: string,
        public confirmPwd?: string,
        public lastLogin?: Date
    ) {  }
}