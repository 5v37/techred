export function formatXML(xml: string, textBlocks: string[] = [], tab = " ", nl = "\r\n",) {
    let formatted = "", indent = "", MixedMode = false, mixedContent = "";
    const MixedNodeStart = textBlocks.map(tag => tag + ">");
    const mixedNodeEnd = textBlocks.map(tag => "/" + tag);
    const nodes = xml.slice(1, -1).split(/>\s*</);
    const spaces = xml.match(/>\s*</g)!;
    if (nodes[0][0] == "?") {
        formatted = "<" + nodes.shift() + ">" + nl;
        spaces.shift();
    };
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];

        if (!MixedMode && MixedNodeStart.some(tag => (node + ">").startsWith(tag))) {
            MixedMode = true;
            mixedContent = "";
        };
        if (MixedMode && mixedNodeEnd.some(tag => node.endsWith(tag))) {
            MixedMode = false;
            node = (mixedContent) ? mixedContent + node : node;
        };

        if (MixedMode) {
            mixedContent += node + spaces[i];
        } else {
            if (node[0] == "/") {
                indent = indent.slice(tab.length);
            };
            formatted += indent + "<" + node + ">" + nl;
            if (node[0] != "/" && node[node.length - 1] != "/" && node.indexOf("</") == -1) {
                indent += tab;
            };
        };
    };
    return formatted;
};

export function parseDataURL(dataURL: string | null) {
    if (dataURL && dataURL.startsWith("data:")) {
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

    return false;
};

export function base64toData(data64: string) {
    const bstr = atob(data64);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return u8arr;
};

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
};

export const isTauriMode = '__TAURI_INTERNALS__' in window;