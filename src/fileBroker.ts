import { formatXML, parseDataURL } from './utils';
import { textBlocks, fb2ns, xlinkns, markBlocks } from './fb2Model';

type Subscribers = {
    parseHandler: (source: Element | undefined) => void,
    serializeHandler: (xmlDoc: Document, target: Element) => void,
    elementId: string
}
type documentBlocks = {
    [key: string]: Element | undefined
}

class fileBroker {
    private subs: Subscribers[] = [];
    private initialData: documentBlocks | undefined;

    addSubscriber(parseHandler: (source: Element | undefined) => void, serializeHandler: (xmlDoc: Document, target: Element) => void, elementId: string) {
        this.subs.push({ parseHandler, serializeHandler, elementId })
        if (this.initialData) {
            parseHandler(this.initialData[elementId]);
        }
    }

    parse(xml: string) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fixMarks(xml), "text/xml");
        const errorNode = xmlDoc.querySelector("parsererror");
        if (errorNode) {
            throw new Error(errorNode.textContent?.split("\n")[0]);
        };

        replaceInlineImage(xmlDoc);

        const parts = getParts(xmlDoc);
        for (const sub of this.subs) {
            sub.parseHandler(parts[sub.elementId]);
        };

        if (!this.subs.length) {
            this.initialData = parts;
            setTimeout(() => {this.initialData = undefined});
        };
    }

    serialize() {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlTemplate, "text/xml");

        const parts = getParts(xmlDoc);
        for (const sub of this.subs) {
            sub.serializeHandler(xmlDoc, parts[sub.elementId]!);
        };

        moveImageToBinary(xmlDoc);

        const serializer = new XMLSerializer();
        const xmlStr = serializer.serializeToString(xmlDoc).replace(/\n/g, "").replace(/  +/g, " ");
        return formatXML(fixMarks(xmlStr), textBlocks);
    }

    reset() {
        this.parse(xmlTemplate);
    }
}

const xmlTemplate =
`<?xml version="1.0" encoding="UTF-8"?>
<FictionBook xmlns="http://www.gribuser.ru/xml/fictionbook/2.0" xmlns:l="http://www.w3.org/1999/xlink">
 <description>
  <title-info><annotation/></title-info>
  <src-title-info><annotation/></src-title-info>
  <document-info><history/></document-info>
  <publish-info/>
 </description>
 <body/>
 <body name="notes"/>
</FictionBook>`;

function getParts(xmlDoc: Document) {
    const [desc] = xmlDoc.getElementsByTagName("description");
    const [body, notes] = xmlDoc.getElementsByTagName("body");

    const parts: documentBlocks = {
        "title-info": undefined,
        "src-title-info": undefined,
        "document-info": undefined,
        "publish-info": undefined,
        "annotation": undefined,
        "src-annotation": undefined,
        "history": undefined,
        "description": desc,
        "body": body,
        "notes": notes
    };

    if (desc) {
        for (const descElement of desc.children) {
            if (descElement.tagName in parts) {
                parts[descElement.tagName] = descElement;
                if (descElement.tagName === "title-info") {
                    [parts.annotation] = descElement.getElementsByTagName("annotation");
                } else if (descElement.tagName === "src-title-info") {
                    [parts["src-annotation"]] = descElement.getElementsByTagName("annotation");
                } else if (descElement.tagName === "document-info") {
                    [parts.history] = descElement.getElementsByTagName("history");
                }
            };
        };
    };

    return parts;
}

function fixMarks(xml: string) {
    const regex = new RegExp('<(' + markBlocks.join("|") + ')>([  ]*)<\/\\1>', 'g');
    return xml.replace(regex, '$2'); // убираем пустые теги
};


function replaceInlineImage(xmlDoc: Document) {
    textBlocks.forEach(tag => {
        xmlDoc.querySelectorAll(tag + " image").forEach(element => {
            const inlineImg = xmlDoc.createElementNS(fb2ns, "inlineimage");
            for (let index = element.attributes.length - 1; index >= 0; --index) {
                inlineImg.attributes.setNamedItem(element.attributes[index].cloneNode() as Attr);
            };
            element.replaceWith(inlineImg);
        });
    });
};

function moveImageToBinary(xmlDoc: Document) {
    const FictionBook = xmlDoc.getElementsByTagName("FictionBook")[0]
    xmlDoc.querySelectorAll("image, inlineimage").forEach(element => {
        const image = parseDataURL(element.getAttribute("src"));
        if (image && image.base64) {
            const binary = xmlDoc.createElementNS(fb2ns, "binary");
            binary.setAttribute("id", element.getAttributeNS(xlinkns, "href")!.substring(1));
            binary.setAttribute("content-type", image.mime);
            binary.textContent = image.data;

            FictionBook.appendChild(binary);
            element.removeAttribute("src");
        };
    });
};

export default new fileBroker();