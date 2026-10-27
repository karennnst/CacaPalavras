import { createEmptyProgress, migrateProgress } from "./game.js";

const DATABASE_NAME = "entre-letras";
const STORE_NAME = "state";
const RECORD_KEY = "player-progress";

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in globalThis)) {
      reject(new Error("Este navegador não disponibiliza armazenamento local compatível."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Não foi possível abrir o armazenamento local."));
    request.onblocked = () => reject(new Error("O armazenamento está ocupado por outra aba do jogo."));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falha ao acessar o armazenamento local."));
  });
}

export async function loadProgress() {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const stored = await requestResult(transaction.objectStore(STORE_NAME).get(RECORD_KEY));
    return stored === undefined ? createEmptyProgress() : migrateProgress(stored);
  } finally {
    database.close();
  }
}

export async function saveProgress(progress, expectedRevision) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(RECORD_KEY);
      let nextRevision;
      let conflict;
      request.onsuccess = () => {
        const currentRevision = request.result?.revision ?? 0;
        if (currentRevision !== expectedRevision) {
          conflict = new Error("Outra aba atualizou o progresso deste dispositivo.");
          conflict.name = "ConflictError";
          transaction.abort();
          return;
        }
        nextRevision = currentRevision + 1;
        store.put({ ...progress, revision: nextRevision }, RECORD_KEY);
      };
      request.onerror = () => reject(request.error ?? new Error("Não foi possível ler o progresso atual."));
      transaction.oncomplete = () => resolve(nextRevision);
      transaction.onerror = () => {
        if (!conflict) reject(transaction.error ?? new Error("Não foi possível guardar o progresso."));
      };
      transaction.onabort = () => reject(conflict ?? transaction.error ?? new Error("O armazenamento cancelou a gravação."));
    });
  } finally {
    database.close();
  }
}
