class Series {
    name: string;
    number?: number;
    id = self.crypto.randomUUID();

    constructor(name = "", number: string | null = null) {
        this.name = name;
        if (number) {
            this.number = +number;
        };
    };
};

export default Series;