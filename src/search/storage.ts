import type { SearchData } from './config'

// The search data kept in the browser (IndexedDB), one record per locale. A record whose version differs
// from the page's is ignored and overwritten after the fresh copy is fetched. Every failure (private mode,
// blocked storage, old browser) just means "not stored": the data then comes from the network.

const DB_NAME = 'kasownik'
const DB_VERSION = 1
const STORE = 'search'

let dbPromise: Promise<IDBDatabase | null> | null = null

const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null)
      const open = indexedDB.open(DB_NAME, DB_VERSION)
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE)
      }
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => resolve(null)
      open.onblocked = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

export async function readStored(locale: string, version: string): Promise<SearchData | null> {
  try {
    const db = await openDb()
    if (!db) return null
    const stored = await request<SearchData | undefined>(
      db.transaction(STORE, 'readonly').objectStore(STORE).get(locale),
    )
    return stored?.version === version && Array.isArray(stored.docs) ? stored : null
  } catch {
    return null
  }
}

export async function writeStored(data: SearchData): Promise<void> {
  try {
    const db = await openDb()
    if (!db) return
    await request(db.transaction(STORE, 'readwrite').objectStore(STORE).put(data, data.locale))
  } catch {
    // Quota or blocked storage: the next page load fetches again (usually from the HTTP cache)
  }
}

// Tests only
export function resetStorageConnection() {
  dbPromise = null
}
