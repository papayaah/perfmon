import { openDB } from 'idb';

const DB_NAME = 'perfmon-db';
const STORE_NAME = 'reports';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('url', 'url');
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
};

export const addReport = async (report) => {
  const db = await initDB();
  return db.add(STORE_NAME, report);
};

export const getReports = async () => {
  const db = await initDB();
  return db.getAllFromIndex(STORE_NAME, 'timestamp');
};

export const deleteReport = async (id) => {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
};

