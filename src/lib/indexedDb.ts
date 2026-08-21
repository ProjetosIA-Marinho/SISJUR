// src/lib/indexedDb.ts

const DB_NAME = 'SisjurBackupsDB';
const STORE_NAME = 'backups';

// Função para iniciar e conectar ao Banco de Dados IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    // Abre a conexão, versão 1
    const request = indexedDB.open(DB_NAME, 1);
    
    // Cria a estrutura na primeira vez que for rodado
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Função para Salvar os dados (substitui o setItem)
export const saveToIndexedDB = async (key: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    store.put(data, key); // Guarda o dado atrelado à chave
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

// Função para Recuperar os dados (substitui o getItem)
export const getFromIndexedDB = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};
