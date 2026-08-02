const STORE_NAME = "data";
const DATABASE_VERSION = 2;

function openDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(name, mode, callback) {
  const db = await openDatabase(name);

  return new Promise((resolve, reject) => {
    let transaction;
    let request;

    try {
      transaction = db.transaction(STORE_NAME, mode);
      request = callback(transaction.objectStore(STORE_NAME));
    } catch (error) {
      db.close();
      reject(error);
      return;
    }

    const close = () => db.close();

    transaction.oncomplete = () => {
      close();
      resolve(request.result);
    };
    transaction.onerror = transaction.onabort = () => {
      close();
      reject(transaction.error);
    };
    request.onerror = () => {
      close();
      reject(request.error);
    };
  });
}

export function getItem(databaseName, key) {
  return run(databaseName, "readonly", (store) => store.get(key));
}

export function setItem(databaseName, key, value) {
  return run(databaseName, "readwrite", (store) => store.put(value, key));
}

export function removeItem(databaseName, key) {
  return run(databaseName, "readwrite", (store) => store.delete(key));
}
