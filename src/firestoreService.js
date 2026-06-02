import {
  collection, doc, getDocs, getDoc,
  addDoc, setDoc, updateDoc, deleteDoc,
  query, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Collections ──────────────────────────────────────────
const MEMBERS = "members";
const BOOKS = "books";
const COLLECTIONS = "collections";
const CONFIG = "config";

// ── Seed initial org config if missing ───────────────────
export async function seedConfig() {
  const ref = doc(db, CONFIG, "org");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: "Niranam Chudan Vallasamithi & NBC",
      reg: "Reg. PTM/TC/105/2022",
      event: "Mega Lucky Draw 2026",
      grandPrize: "Maruti Suzuki Wagon R",
      sponsor: "KGA Mall Changanassery",
      ticketPrice: 1000,
      createdAt: serverTimestamp(),
    });
  }
}

// ── Members ───────────────────────────────────────────────
export async function getMembers() {
  const snap = await getDocs(query(collection(db, MEMBERS), orderBy("createdAt", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addMember(data) {
  const ref = await addDoc(collection(db, MEMBERS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMember(id, data) {
  await updateDoc(doc(db, MEMBERS, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteMember(id) {
  await deleteDoc(doc(db, MEMBERS, id));
}

// ── Books ─────────────────────────────────────────────────
export async function getBooks() {
  const snap = await getDocs(query(collection(db, BOOKS), orderBy("createdAt", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addBook(data) {
  const ref = await addDoc(collection(db, BOOKS), {
    ...data,
    status: "not_started",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBook(id, data) {
  await updateDoc(doc(db, BOOKS, id), { ...data, updatedAt: serverTimestamp() });
}

// ── Collections (payments) ────────────────────────────────
export async function getCollections() {
  const snap = await getDocs(query(collection(db, COLLECTIONS), orderBy("createdAt", "asc")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addCollection(data) {
  const ref = await addDoc(collection(db, COLLECTIONS), {
    ...data,
    createdAt: serverTimestamp(),
  });
  // Auto-update book status
  const bookSnap = await getDoc(doc(db, BOOKS, data.bookId));
  if (bookSnap.exists()) {
    const book = bookSnap.data();
    const allCols = await getDocs(query(collection(db, COLLECTIONS)));
    const bookCols = allCols.docs
      .filter(d => d.data().bookId === data.bookId)
      .map(d => d.data());
    const totalSold = bookCols.reduce((s, c) => s + (c.ticketsSold || 0), 0) + data.ticketsSold;
    const status = totalSold >= book.ticketCount ? "complete" : "ongoing";
    await updateDoc(doc(db, BOOKS, data.bookId), { status, updatedAt: serverTimestamp() });
  }
  return ref.id;
}

// ── Config ────────────────────────────────────────────────
export async function getConfig() {
  const snap = await getDoc(doc(db, CONFIG, "org"));
  return snap.exists() ? snap.data() : null;
}

// ── Real-time listeners ───────────────────────────────────
export function listenMembers(callback) {
  return onSnapshot(query(collection(db, MEMBERS), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function listenBooks(callback) {
  return onSnapshot(query(collection(db, BOOKS), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function listenCollections(callback) {
  return onSnapshot(query(collection(db, COLLECTIONS), orderBy("createdAt", "asc")), snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}
