import { collection, doc, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

const C = { MEMBERS:"members", BOOKS:"books", COLLECTIONS:"collections", CONFIG:"config", LOGS:"activity_logs" };

export async function seedConfig() {
  const ref = doc(db, C.CONFIG, "org");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { name:"Niranam Chudan Vallasamithi & NBC", reg:"Reg. PTM/TC/105/2022", event:"Mega Lucky Draw 2026", ticketPrice:1000, createdAt:serverTimestamp() });
  }
}
export async function getConfig() { const s = await getDoc(doc(db,C.CONFIG,"org")); return s.exists()?s.data():null; }

// Members
export async function getMembers() { const s=await getDocs(query(collection(db,C.MEMBERS),orderBy("createdAt","asc"))); return s.docs.map(d=>({id:d.id,...d.data()})); }
export async function addMember(data) { return (await addDoc(collection(db,C.MEMBERS),{...data,createdAt:serverTimestamp()})).id; }
export async function updateMember(id,data) { await updateDoc(doc(db,C.MEMBERS,id),{...data,updatedAt:serverTimestamp()}); }
export async function deleteMember(id) { await deleteDoc(doc(db,C.MEMBERS,id)); }

// Books
export async function getBooks() { const s=await getDocs(query(collection(db,C.BOOKS),orderBy("createdAt","asc"))); return s.docs.map(d=>({id:d.id,...d.data()})); }
export async function addBook(data) { return (await addDoc(collection(db,C.BOOKS),{...data,status:"not_started",createdAt:serverTimestamp()})).id; }
export async function updateBook(id,data) { await updateDoc(doc(db,C.BOOKS,id),{...data,updatedAt:serverTimestamp()}); }

// Collections
export async function addCollection(data) {
  const ref = await addDoc(collection(db,C.COLLECTIONS),{...data,createdAt:serverTimestamp()});
  const bookSnap = await getDoc(doc(db,C.BOOKS,data.bookId));
  if (bookSnap.exists()) {
    const book = bookSnap.data();
    const allC = await getDocs(collection(db,C.COLLECTIONS));
    const bookCols = allC.docs.filter(d=>d.data().bookId===data.bookId).map(d=>d.data());
    const totalSold = bookCols.reduce((s,c)=>s+(c.ticketsSold||0),0)+data.ticketsSold;
    const status = (totalSold>=book.ticketCount||data.bookCompleted)?"complete":"ongoing";
    await updateDoc(doc(db,C.BOOKS,data.bookId),{status,updatedAt:serverTimestamp()});
  }
  return ref.id;
}

// Activity logs
export async function addLog(data) { await addDoc(collection(db,C.LOGS),{...data,createdAt:serverTimestamp()}); }

// Listeners
export function listenMembers(cb) { return onSnapshot(query(collection(db,C.MEMBERS),orderBy("createdAt","asc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()})))); }
export function listenBooks(cb)   { return onSnapshot(query(collection(db,C.BOOKS),  orderBy("createdAt","asc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()})))); }
export function listenCollections(cb){ return onSnapshot(query(collection(db,C.COLLECTIONS),orderBy("createdAt","asc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()})))); }
export function listenLogs(cb)    { return onSnapshot(query(collection(db,C.LOGS),   orderBy("createdAt","desc")),s=>cb(s.docs.map(d=>({id:d.id,...d.data()})))); }
