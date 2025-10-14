export function formatXML(xml: string, textBlocks: string[] = [], tab = " ", nl = "\n") {
    let formatted = "", indent = "", mixedMode = false, mixedContent = "";
    const mixedNodeStart = textBlocks.map(tag => tag + ">");
    const mixedNodeEnd = textBlocks.map(tag => "/" + tag);
    const nodes = xml.slice(1, -1).split(/>\s*</);
    const spaces = xml.match(/>\s*</g)!;
    if (nodes[0][0] === "?") {
        formatted = "<" + nodes.shift() + ">" + nl;
        spaces.shift();
    };
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];

        if (!mixedMode && mixedNodeStart.some(tag => (node + ">").startsWith(tag))) {
            mixedMode = true;
            mixedContent = "";
        };
        if (mixedMode && mixedNodeEnd.some(tag => node.endsWith(tag))) {
            mixedMode = false;
            node = (mixedContent) ? mixedContent + node : node;
        };

        if (mixedMode) {
            mixedContent += node + spaces[i];
        } else {
            if (node[0] === "/") {
                indent = indent.slice(tab.length);
            };
            formatted += indent + "<" + node + ">" + nl;
            if (node[0] !== "/" && node[node.length - 1] !== "/" && node.indexOf("</") === -1) {
                indent += tab;
            };
        };
    };
    return formatted;
}

function equalBytes(data: Uint8Array, decl: number[]) {
    for (let idx = 0; idx < decl.length; idx++) {
        if (data[idx] !== decl[idx]) {
            return false;
        };
    };
    return true;
}

export function imageFileType(fileData: ArrayBuffer) {
    const startFile = new Uint8Array(fileData, 0, 8);
    if (equalBytes(startFile, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) {
        return "image/png";
    } else if (equalBytes(startFile, [0xFF, 0xD8, 0xFF])) {
        return "image/jpeg";
    };
}

export function decodeXML(xmlData: ArrayBuffer) {
    const startDecls = [
        {
            encoding: 'utf-8', // with BOM
            bytes: [0xEF, 0xBB, 0xBF]
        },
        {
            encoding: 'utf-16le', // with BOM
            bytes: [0xFF, 0xFE]
        },
        {
            encoding: 'utf-16be', // with BOM
            bytes: [0xFE, 0xFF]
        },
        {
            encoding: 'utf-16le', // without BOM
            bytes: [0x3C, 0x00, 0x3F, 0x00]
        },
        {
            encoding: 'utf-16be', // without BOM
            bytes: [0x00, 0x3C, 0x00, 0x3F]
        }
    ];

    let encoding: string | undefined;

    const startXml = new Uint8Array(xmlData, 0, 100);
    const decl = startDecls.find(decl => equalBytes(startXml, decl.bytes));
    if (!decl) {
        if (equalBytes(startXml, [0x3C, 0x3F])) { // has prolog
            const prolog = new TextDecoder().decode(startXml);
            const match = prolog.match(/encoding=['"]([A-Za-z]([A-Za-z0-9._]|-)*)['"]/);
            if (match) {
                encoding = match[1];
            };
        };
    } else {
        encoding = decl.encoding;
    };

    return new TextDecoder(encoding).decode(xmlData);
}

export function parseDataURL(dataURL: string | undefined) {
    if (dataURL?.startsWith("data:")) {
        const [mediatype, data] = dataURL.substring(5).split(",")
        const parameters = mediatype.split(";");
        let mime = "text/plain";
        let base64 = false;
        let params: { [key: string]: string; } = {};
        if (parameters.length) {
            let idx = 0, end = parameters.length;
            if (parameters[0].length && parameters[0].includes("/")) {
                mime = parameters[0];
                idx++
            };
            if (parameters[end - 1] === "base64") {
                base64 = true;
                end--;
            };
            for (; idx < end; idx++) {
                const [key, value] = parameters[idx].split("=");
                params[key] = value;
            }
        };
        return { mime, params, base64, data };
    };

    return undefined;
}

export function base64toData(data64: string) {
    const bstr = atob(data64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return u8arr;
}

export function addingNodes(xmlDoc: Document, nameSpace: string) {
    type attrType = {
        key: string,
        value: string | undefined
    };
    function addElement(root: Element, name: string, value: string | undefined, required = false, attrs: attrType[] = []) {
        if (value || required) {
            const newNode = xmlDoc.createElementNS(nameSpace, name);
            if (value) {
                newNode.appendChild(xmlDoc.createTextNode(value));
            };
            for (const attr of attrs) {
                if (attr.value !== undefined) {
                    newNode.setAttribute(attr.key, attr.value);
                };
            };
            root.appendChild(newNode);
        };
    };
    return addElement;
}

export function isMac() {
    return typeof navigator != "undefined" ? /Mac|iP(hone|[oa]d)/.test(navigator.platform)
        // @ts-ignore
        : typeof os != "undefined" && os.platform ? os.platform() == "darwin" : false;
}

export const NCNameFilter = { pattern: /^[\p{L}_][\p{L}\p{N}_.-]*$/u, validateOnly: true };

export const isTauriMode = __APP_TAURI_MODE__;