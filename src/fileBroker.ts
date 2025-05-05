import { formatXML } from './utils';
import { textBlocks, markBlocks, xmlTemplate } from './fb2Model';

type Subscribers = {
    parseHandler: (source: Element | undefined) => void,
    serializeHandler: (xmlDoc: Document, target: Element) => void,
    elementId: string
}
type documentBlocks = {
    [key: string]: Element | undefined
}

class fileBroker {
    private descs: Array<(xmlDoc: Document, method: string) => documentBlocks> = []
    private subs: Subscribers[] = [];
    private initialData: { parts: documentBlocks, xmlDoc: Document } | undefined;

    addDescriber(partsHandler: (xmlDoc: Document, method: string) => documentBlocks) {
        this.descs.push(partsHandler);
        if (this.initialData) {
            Object.assign(this.initialData.parts, partsHandler(this.initialData.xmlDoc, "init"));
        }
    }

    addSubscriber(parseHandler: (source: Element | undefined) => void, serializeHandler: (xmlDoc: Document, target: Element) => void, elementId: string) {
        this.subs.push({ parseHandler, serializeHandler, elementId })
        if (this.initialData) {
            parseHandler(this.initialData.parts[elementId]);
        }
    }

    parse(xml: string) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fixMarks(xml), "text/xml");
        const errorNode = xmlDoc.querySelector("parsererror");
        if (errorNode) {
            throw new Error(errorNode.textContent?.split("\n")[0]);
        };

        const parts = this.getParts(xmlDoc, "parse");
        for (const sub of this.subs) {
            sub.parseHandler(parts[sub.elementId]);
        };

        if (!this.subs.length) {
            this.initialData = { parts, xmlDoc };
            setTimeout(() => { this.initialData = undefined });
        };
    }

    serialize() {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlTemplate, "text/xml");

        const parts = this.getParts(xmlDoc, "serialize");
        for (const sub of this.subs) {
            sub.serializeHandler(xmlDoc, parts[sub.elementId]!);
        };

        const serializer = new XMLSerializer();
        const xmlStr = serializer.serializeToString(xmlDoc).replace(/  +/g, " ");
        return formatXML(fixMarks(xmlStr), textBlocks);
    }

    reset() {
        this.parse(xmlTemplate);
    }

    private getParts(xmlDoc: Document, method: string) {
        let blocks: documentBlocks[] = [];
        for (const partsHandler of this.descs) {
            blocks.push(partsHandler(xmlDoc, method));
        }
        return Object.assign({}, ...blocks);
    }
}

function fixMarks(xml: string) {
    const regex = new RegExp('<(' + markBlocks.join("|") + ')>([  ]*)<\/\\1>', 'g');
    return xml.replace(regex, '$2'); // убираем пустые теги
};

export type { documentBlocks };
export default new fileBroker();