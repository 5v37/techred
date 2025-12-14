type PersonProps = "first-name" | "middle-name" | "last-name" | "nickname" | "home-page" | "email";
class PersonInfo implements Record<PersonProps, string> {
    "first-name"  = "";
    "middle-name" = "";
    "last-name"   = "";
    "nickname"    = "";
    "home-page"   = "";
    "email"       = "";
    id = self.crypto.randomUUID();

    constructor(item?: Element) {
        if (item) {
            for (const person of item.children) {
                if (person.tagName in this && person.textContent) {
                    this[person.tagName as PersonProps] = person.textContent.trim();
                };
            };
        };
    };

    props() {
        const props = [];
        for (const key in this) {
            if (key !== "id" && typeof this[key] !== 'function') {
                const required = key === "first-name" && !this.isShort() || key === "nickname" && this.isShort();
                props.push({ key: `${key}`, value: `${this[key]}`, required: required })
            };
        };
        return props;
    };

    isShort(): boolean {
        return !this['first-name'] && !this['middle-name'] && !this['last-name'];
    };
}

export default PersonInfo;