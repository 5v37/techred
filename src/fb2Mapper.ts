import { formatXML } from './utils';
import { textBlocks, markBlocks, xmlTemplate } from './fb2Model';

type DocumentBlocks = { [key: string]: Element | undefined }
type ParseHandler = (source: Element | undefined) => void;
type SerializeHandler = (xmlDoc: Document, target: Element) => void;
type Preprocessor = (xmlDoc: Document, method: string) => DocumentBlocks;
type Processor = {
    parseHandler: ParseHandler,
    serializeHandler: SerializeHandler,
    elementId: string,
    order: number
}

class fb2Mapper {
    private preprocessors: Array<Preprocessor> = []
    private processors: Processor[] = [];
    private updateProcessors?: () => Promise<void>;

    addPreprocessor(preprocessor: Preprocessor) {
        this.preprocessors.push(preprocessor);
    }

    addProcessor(parseHandler: ParseHandler, serializeHandler: SerializeHandler, elementId: string, order = 0) {
        this.processors.push({ parseHandler, serializeHandler, elementId, order });
    }

    delProcessor(elementId: string) {
        this.processors = this.processors.filter(item => item.elementId !== elementId);
    }

    setUpdateProcessor(updateProcessors: () => Promise<void>) {
        this.updateProcessors = updateProcessors;
    }

    async parse(xml: string) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(fixMarks(xml), "text/xml");
        const errorNode = xmlDoc.querySelector("parsererror");
        if (errorNode) {
            throw new Error(errorNode.textContent?.split("\n")[0]);
        };

        const parts = this.getBlocks(xmlDoc, "parse");
        await this.updateProcessors?.();
        this.updateProcessors = undefined;
        this.processors.sort((s1, s2) => s1.order - s2.order);
        for (const proc of this.processors) {
            proc.parseHandler(parts[proc.elementId]);
        };
    }

    serialize() {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlTemplate, "text/xml");

        const parts = this.getBlocks(xmlDoc, "serialize");
        for (const proc of this.processors) {
            proc.serializeHandler(xmlDoc, parts[proc.elementId]!);
        };

        const serializer = new XMLSerializer();
        const xmlStr = serializer.serializeToString(xmlDoc).replace(/  +/g, " ");
        return formatXML(fixMarks(xmlStr), textBlocks);
    }

    async reset() {
        await this.parse(xmlTemplate);
    }

    private getBlocks(xmlDoc: Document, method: string) {
        let blocks: DocumentBlocks[] = [];
        for (const preproc of this.preprocessors) {
            blocks.push(preproc(xmlDoc, method));
        }
        return Object.assign({}, ...blocks);
    }
}

function fixMarks(xml: string) {
    const regex = new RegExp('<(' + markBlocks.join("|") + ')>([  ]*)<\/\\1>', 'g');
    return xml.replace(regex, '$2'); // убираем пустые теги
};

export type { DocumentBlocks };
export default new fb2Mapper();