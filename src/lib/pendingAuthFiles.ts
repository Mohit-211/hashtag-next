/**
 * Files (e.g. uploaded logos) that belong to a pending auth action. They are
 * too large for sessionStorage, so they go to IndexedDB, which stores File
 * objects as-is. Only one set is kept, tagged with the pending action's id.
 */

const DB_NAME = "hb-pending-auth";
const STORE = "files";
const RECORD_KEY = "pending";

export interface PendingFileEntry {
  /** Caller-defined key, e.g. "<customizationId>:<imageId>:file". */
  key: string;
  file: File;
}

interface StoredRecord {
  actionId: string;
  entries: PendingFileEntry[];
}

const openDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>) => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
};

export const savePendingFiles = async (actionId: string, entries: PendingFileEntry[]): Promise<boolean> => {
  try {
    if (entries.length === 0) {
      await clearPendingFiles();
      return true;
    }
    await run("readwrite", (s) => s.put({ actionId, entries } satisfies StoredRecord, RECORD_KEY));
    return true;
  } catch {
    return false;
  }
};

/** Files saved for `actionId`, or [] if none / they belong to another action. */
export const loadPendingFiles = async (actionId: string): Promise<PendingFileEntry[]> => {
  try {
    const record = await run<StoredRecord | undefined>("readonly", (s) => s.get(RECORD_KEY));
    return record?.actionId === actionId ? record.entries : [];
  } catch {
    return [];
  }
};

export const clearPendingFiles = async () => {
  try {
    await run("readwrite", (s) => s.delete(RECORD_KEY));
  } catch {
    /* nothing to clear */
  }
};
