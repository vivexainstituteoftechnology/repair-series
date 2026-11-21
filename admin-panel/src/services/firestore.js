import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

const ensureDb = () => {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase is not configured.')
}

/**
 * Realtime listener for a collection.
 * @param {object} [options]
 * @param {string} [options.orderByField]
 * @param {'asc'|'desc'} [options.orderDirection]
 * @param {number} [options.limit]
 */
export const subscribeCollection = (collectionName, onData, onError, options = {}) => {
  ensureDb()
  const constraints = []
  if (options.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'))
  }
  if (options.limit != null && Number(options.limit) > 0) {
    constraints.push(limit(Number(options.limit)))
  }
  const ref = collection(db, collectionName)
  const q = constraints.length ? query(ref, ...constraints) : ref
  return onSnapshot(
    q,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      onData(rows, snapshot.docChanges())
    },
    onError,
  )
}

/** Realtime listener for a single document. */
export const subscribeDoc = (collectionName, docId, onData, onError) => {
  ensureDb()
  const ref = doc(db, collectionName, docId)
  return onSnapshot(
    ref,
    (snapshot) => {
      onData(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
    },
    onError,
  )
}

export const fetchDoc = async (collectionName, docId) => {
  ensureDb()
  const snapshot = await getDoc(doc(db, collectionName, docId))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

/**
 * Replaces the document at `id` (no merge).
 * Preserves `createdAt` when updating if not supplied in `data`.
 * Uses `data.createdAt` / `data.updatedAt` when provided (e.g. CSV import).
 */
export const setDocumentReplace = async (collectionName, id, data) => {
  ensureDb()
  const ref = doc(db, collectionName, id)
  const existing = await getDoc(ref)
  const existingData = existing.exists() ? existing.data() : null

  const incomingCreated = data.createdAt
  const incomingUpdated = data.updatedAt
  const { createdAt: _dropC, updatedAt: _dropU, ...rest } = data

  const createdAt =
    incomingCreated != null
      ? incomingCreated
      : existingData?.createdAt != null
        ? existingData.createdAt
        : serverTimestamp()

  const updatedAt = incomingUpdated != null ? incomingUpdated : serverTimestamp()

  await setDoc(ref, {
    ...rest,
    createdAt,
    updatedAt,
  })
}

export const createDoc = async (collectionName, data) => {
  ensureDb()
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const upsertDoc = async (collectionName, id, data) => {
  ensureDb()
  const ref = doc(db, collectionName, id)
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export const updateDocFields = async (collectionName, id, fields) => {
  ensureDb()
  const ref = doc(db, collectionName, id)
  await updateDoc(ref, { ...fields, updatedAt: serverTimestamp() })
}

export const removeDoc = async (collectionName, id) => {
  ensureDb()
  await deleteDoc(doc(db, collectionName, id))
}

const MERGE_CHUNK = 400

/** Merge-write many docs without replacing unrelated fields. */
export const commitMergedPatches = async (patches) => {
  ensureDb()
  const list = Array.isArray(patches) ? patches.filter((p) => p?.collection && p?.id && p?.fields) : []
  for (let i = 0; i < list.length; i += MERGE_CHUNK) {
    const chunk = list.slice(i, i + MERGE_CHUNK)
    const batch = writeBatch(db)
    for (const patch of chunk) {
      batch.set(
        doc(db, patch.collection, patch.id),
        { ...patch.fields, updatedAt: serverTimestamp() },
        { merge: true },
      )
    }
    await batch.commit()
  }
}

export const createBatchDocs = async (collectionName, items) => {
  ensureDb()
  const list = Array.isArray(items) ? items : []
  const createdIds = []
  for (let i = 0; i < list.length; i += MERGE_CHUNK) {
    const chunk = list.slice(i, i + MERGE_CHUNK)
    const batch = writeBatch(db)
    for (const item of chunk) {
      const ref = doc(collection(db, collectionName))
      batch.set(ref, {
        ...item,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      createdIds.push(ref.id)
    }
    await batch.commit()
  }
  return createdIds
}

export const deleteBatchDocs = async (collectionName, ids) => {
  ensureDb()
  const list = Array.isArray(ids) ? ids : []
  for (let i = 0; i < list.length; i += MERGE_CHUNK) {
    const chunk = list.slice(i, i + MERGE_CHUNK)
    const batch = writeBatch(db)
    for (const id of chunk) {
      batch.delete(doc(db, collectionName, id))
    }
    await batch.commit()
  }
}

export const fetchDocsWhere = async (collectionName, field, value) => {
  ensureDb()
  const q = query(collection(db, collectionName), where(field, '==', value))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const getBookingsForDay = async ({ dayStart, dayEnd }) => {
  ensureDb()
  // Requires bookings documents to have `scheduledAt` (Timestamp).
  const q = query(
    collection(db, 'bookings'),
    where('scheduledAt', '>=', dayStart),
    where('scheduledAt', '<', dayEnd),
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}
