export class Rating {
    constructor(
        public id?: number,
        public item?: number,
        public user?: number,
        public date?: number,
        public rating?: number,
        public review?: string
    ) { }
}