declare global {
	interface FileSystemObserverRecord {
		type: "appeared" | "disappeared" | "modified" | "moved";
		changedHandle: FileSystemHandle;
		relativePathComponents?: string[];
		relativePathMovedFrom?: string[];
	}

	class FileSystemObserver {
		constructor(callback: (records: FileSystemObserverRecord[]) => void);

		observe(handle: FileSystemFileHandle | FileSystemDirectoryHandle | FileSystemSyncAccessHandle): Promise<void>;
		disconnect(): void;
	}

	interface Window {
		FileSystemObserver: typeof FileSystemObserver;
	}
}

export { };