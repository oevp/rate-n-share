export class Recommendation {
    constructor(
        public id?: number,
        public item?: number,
        public user?: number,
        public recommendsTo?: number,
        public date?: number
    ) { }
}