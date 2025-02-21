class Customs {
    type: string;
    value: string;
    id = self.crypto.randomUUID();

    constructor(type = "", value = "") {
        this.type = type;
        this.value = value;
    };
};

export default Customs;