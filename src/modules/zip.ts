const MIN_EOCD_SIZE = 22;
const MAX_COMMENT_SIZE = 0xffff;
const LOCAL_HEADER_SIZE = 30;
const CD_HEADER_SIZE = 46;
const HEADER_SIGNATURE = 0x04034b50;
const EOCD_SIGNATURE = 0x06054b50;
const CD_SIGNATURE = 0x02014b50;

async function deflate(data: ArrayBuffer, restore: boolean): Promise<ArrayBuffer> {
	const stream = restore ? new DecompressionStream("deflate-raw") : new CompressionStream("deflate-raw");
	const writer = stream.writable.getWriter();
	writer.write(data);
	writer.close();
	return await new Response(stream.readable).arrayBuffer();
}

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
	let crc = i;
	for (let j = 0; j < 8; j++) {
		crc = (crc >>> 1) ^ ((crc & 1) * 0xEDB88320);
	}
	crcTable[i] = crc;
};

function CRC32(data: ArrayBuffer) {
	let value = 0xFFFFFFFF;
	for (const byte of new Uint8Array(data)) {
		value = (value >>> 8) ^ crcTable[(value ^ byte) & 0xFF];
	};
	return (value ^ 0xFFFFFFFF) >>> 0;
};

export async function unpack(fileData: ArrayBuffer) {
	const localHeaderView = new DataView(fileData, 0, LOCAL_HEADER_SIZE);
	if (localHeaderView.getUint32(0, true) === HEADER_SIGNATURE) {
		const startByte = fileData.byteLength > MAX_COMMENT_SIZE ? fileData.byteLength - MAX_COMMENT_SIZE : 0;
		const endOfCentralDirView = new DataView(fileData, startByte);
		for (let i = endOfCentralDirView.byteLength - MIN_EOCD_SIZE; i >= 0; i--) {
			if (endOfCentralDirView.getUint32(i, true) === EOCD_SIGNATURE) {
				const commentLength = endOfCentralDirView.getUint16(i + 20, true);
				if (i + MIN_EOCD_SIZE + commentLength === endOfCentralDirView.byteLength) {
					const entriesCount = endOfCentralDirView.getUint16(i + 10, true);
					if (entriesCount === 0) {
						throw new Error("Файл архива пустой");
					} else if (entriesCount > 1) {
						throw new Error("Файл архива содержит больше одного файла");
					} else {
						const centralDirOffset = endOfCentralDirView.getUint32(i + 16, true);
						const centralDirView = new DataView(fileData, centralDirOffset, CD_HEADER_SIZE);

						if (centralDirView.getUint32(0, true) !== CD_SIGNATURE) {
							break;
						}

						const compressionMethod = centralDirView.getUint16(10, true);
						const compressedSize = centralDirView.getUint32(20, true);

						if (centralDirView.getUint32(42, true) !== 0) {
							break;
						}

						const dataOffset = LOCAL_HEADER_SIZE + localHeaderView.getUint16(26, true) + localHeaderView.getUint16(28, true);
						const compressed = fileData.slice(dataOffset, dataOffset + compressedSize);

						if (compressionMethod === 0) {
							return compressed;
						} else if (compressionMethod === 8) {
							return await deflate(compressed, true);
						} else {
							throw new Error(`Неподдерживаемый способ сжатия: ${compressionMethod}`);
						};
					};
				};
			};
		};
		throw new Error("Некорректный файл архива");
	};
	return fileData;
}

export async function pack(fileData: ArrayBuffer, fileName: string) {
	const modified = new Date();
	const CRC = CRC32(fileData);
	const encodedFileName = new TextEncoder().encode(fileName);
	const compressed = await deflate(fileData, false);

	const zipFile = new ArrayBuffer(LOCAL_HEADER_SIZE + encodedFileName.length * 2 + compressed.byteLength + CD_HEADER_SIZE + MIN_EOCD_SIZE);

	let offset = 0;
	const headerView = new DataView(zipFile, offset, LOCAL_HEADER_SIZE);
	headerView.setUint32(offset, HEADER_SIGNATURE, true); offset += 4;
	headerView.setUint16(offset, 20, true); offset += 2;
	headerView.setUint16(offset, 0x0800, true); offset += 2;
	headerView.setUint16(offset, 8, true); offset += 2;
	headerView.setUint16(offset, (modified.getHours() << 11) | (modified.getMinutes() << 5) | (modified.getSeconds() >> 1), true); offset += 2;
	headerView.setUint16(offset, ((modified.getFullYear() - 1980) << 9) | ((modified.getMonth() + 1) << 5) | modified.getDate(), true); offset += 2;
	headerView.setUint32(offset, CRC, true); offset += 4;
	headerView.setUint32(offset, compressed.byteLength, true); offset += 4;
	headerView.setUint32(offset, fileData.byteLength, true); offset += 4;
	headerView.setUint16(offset, encodedFileName.length, true); offset += 2;
	headerView.setUint16(offset, 0, true); offset += 2;

	new Uint8Array(zipFile, offset).set(encodedFileName); offset += encodedFileName.length;
	new Uint8Array(zipFile, offset).set(new Uint8Array(compressed)); offset += compressed.byteLength;

	const centralDirOffset = offset;
	const centralDirView = new DataView(zipFile, offset, CD_HEADER_SIZE);
	centralDirView.setUint32(0, CD_SIGNATURE, true);
	centralDirView.setUint16(4, 20, true);
	centralDirView.setUint16(6, 20, true);
	new Uint8Array(zipFile, offset + 8).set(new Uint8Array(zipFile, 6, 22)); offset += CD_HEADER_SIZE;

	new Uint8Array(zipFile, offset).set(encodedFileName); offset += encodedFileName.length;

	const view = new DataView(zipFile, offset, MIN_EOCD_SIZE);
	view.setUint32(0, 0x06054b50, true);
	view.setUint16(8, 1, true);
	view.setUint16(10, 1, true);
	view.setUint32(12, offset - centralDirOffset, true);
	view.setUint32(16, centralDirOffset, true);

	return zipFile;
}