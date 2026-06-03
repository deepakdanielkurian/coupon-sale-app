import {
  collection, doc, getDocs, getDoc, addDoc, setDoc,
  updateDoc, deleteDoc, query, orderBy, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const C = {
  MEMBERS:     "members",
  BOOKS:       "books",
  COLLECTIONS: "collections",
  CONFIG:      "config",
  LOGS:        "activity_logs",
  USERS:       "app_users",
  BACKUPS:     "backups",
  REMITTANCES: "remittances",
};

// ── Org config ────────────────────────────────────────────────
export async function seedConfig() {
  const ref  = doc(db, C.CONFIG, "org");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name:        "Niranam Chudan Vallasamithi & NBC",
      reg:         "Reg. PTM/TC/105/2022",
      event:       "Mega Lucky Draw 2026",
      ticketPrice: 1000,
      createdAt:   serverTimestamp(),
    });
  }
}
export async function getConfig() {
  const s = await getDoc(doc(db, C.CONFIG, "org"));
  return s.exists() ? s.data() : null;
}

// ── Seed super admin ONLY if no users exist ───────────────────
// Default credentials: coordinator@nbc.com / NBC@2026
// Super admin MUST change password after first login
export async function seedSuperAdmin() {
  const snap = await getDocs(collection(db, C.USERS));
  if (snap.empty) {
    await addDoc(collection(db, C.USERS), {
      name:      "Coordinator",
      email:     "coordinator@nbc.com",
      password:  "NBC@2026",
      role:      "super_admin",
      mustChangePassword: true,   // flag to prompt password change
      createdAt: serverTimestamp(),
    });
  }
}

// ── App users ──────────────────────────────────────────────────
export async function addAppUser(data) {
  const ref = await addDoc(collection(db, C.USERS), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}
export async function updateAppUser(id, data) {
  await updateDoc(doc(db, C.USERS, id), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteAppUser(id) {
  await deleteDoc(doc(db, C.USERS, id));
}
export function listenAppUsers(cb) {
  return onSnapshot(
    query(collection(db, C.USERS), orderBy("createdAt", "asc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// ── Members ────────────────────────────────────────────────────
export async function addMember(data) {
  return (await addDoc(collection(db, C.MEMBERS), { ...data, createdAt: serverTimestamp() })).id;
}
export async function updateMember(id, data) {
  await updateDoc(doc(db, C.MEMBERS, id), { ...data, updatedAt: serverTimestamp() });
}
export async function deleteMember(id) {
  await deleteDoc(doc(db, C.MEMBERS, id));
}

// ── Books ──────────────────────────────────────────────────────
export async function addBook(data) {
  return (await addDoc(collection(db, C.BOOKS), { ...data, status: "not_started", createdAt: serverTimestamp() })).id;
}
export async function updateBook(id, data) {
  await updateDoc(doc(db, C.BOOKS, id), { ...data, updatedAt: serverTimestamp() });
}

// ── Collections ────────────────────────────────────────────────
export async function addCollection(data) {
  // Write the collection entry first
  const ref = await addDoc(collection(db, C.COLLECTIONS), { ...data, createdAt: serverTimestamp() });

  // Now read ALL collections for this book (including the one just written)
  // to get the true running total — NO double-counting
  const bookSnap = await getDoc(doc(db, C.BOOKS, data.bookId));
  if (bookSnap.exists()) {
    const book      = bookSnap.data();
    const returned  = book.returnedTickets || 0;
    const effective = book.ticketCount - returned;

    // Read all cols for this book AFTER the write (includes new entry)
    const allCols   = await getDocs(collection(db, C.COLLECTIONS));
    const totalSold = allCols.docs
      .filter(d => d.data().bookId === data.bookId)
      .reduce((s, d) => s + (d.data().ticketsSold || 0), 0);
    // Note: do NOT add data.ticketsSold again — it's already included above

    // Only auto-complete when 100% of effective tickets are sold
    const status = totalSold >= effective ? "complete" : "ongoing";
    await updateDoc(doc(db, C.BOOKS, data.bookId), { status, updatedAt: serverTimestamp() });
  }
  return ref.id;
}

// ── Verify a direct-to-treasurer collection entry ───────────
export async function verifyDirectPayment(collectionId) {
  await updateDoc(doc(db, C.COLLECTIONS, collectionId), {
    verifiedByCoordinator: true,
    verifiedAt: serverTimestamp(),
  });
}

// ── Reset book status (fix wrongly-completed books) ──────────
export async function resetBookStatus(bookId) {
  await updateDoc(doc(db, C.BOOKS, bookId), {
    status: "ongoing",
    returnedTickets: 0,
    stoppedSelling: false,
    stopNotes: "",
    updatedAt: serverTimestamp(),
  });
}

// ── Stop selling — record returned tickets and close book ──────
export async function stopSelling(bookId, returnedTickets, notes) {
  await updateDoc(doc(db, C.BOOKS, bookId), {
    status: "complete",
    returnedTickets,
    stoppedSelling: true,
    stopNotes: notes || "",
    updatedAt: serverTimestamp(),
  });
}

// ── Activity logs ──────────────────────────────────────────────
export async function addLog(data) {
  await addDoc(collection(db, C.LOGS), { ...data, createdAt: serverTimestamp() });
}

// ── Backup ────────────────────────────────────────────────────
export async function createBackup(label, createdBy) {
  // Fetch all live data
  const [membersSnap, booksSnap, colsSnap] = await Promise.all([
    getDocs(collection(db, C.MEMBERS)),
    getDocs(collection(db, C.BOOKS)),
    getDocs(collection(db, C.COLLECTIONS)),
  ]);

  const backup = {
    label,
    createdBy,
    createdAt: serverTimestamp(),
    timestamp: new Date().toISOString(),
    counts: {
      members:     membersSnap.size,
      books:       booksSnap.size,
      collections: colsSnap.size,
    },
    data: {
      members:     membersSnap.docs.map(d => ({ _id: d.id, ...d.data() })),
      books:       booksSnap.docs.map(d => ({ _id: d.id, ...d.data() })),
      collections: colsSnap.docs.map(d => ({ _id: d.id, ...d.data() })),
    },
  };

  const ref = await addDoc(collection(db, C.BACKUPS), backup);
  return ref.id;
}

export function listenBackups(cb) {
  return onSnapshot(
    query(collection(db, C.BACKUPS), orderBy("createdAt", "desc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

export async function deleteBackup(id) {
  await deleteDoc(doc(db, C.BACKUPS, id));
}


// ── Remittances ───────────────────────────────────────────────
export async function addRemittance(data) {
  const ref = await addDoc(collection(db, C.REMITTANCES), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}
export function listenRemittances(cb) {
  return onSnapshot(
    query(collection(db, C.REMITTANCES), orderBy("createdAt", "desc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() })))
  );
}

// Download backup as JSON file
export function downloadBackupJSON(backup) {
  const clean = { ...backup };
  delete clean.id;
  const blob    = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href        = url;
  a.download    = `NBC_Backup_${backup.label || backup.timestamp?.split("T")[0] || "export"}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Realtime listeners ─────────────────────────────────────────
export function listenMembers(cb) {
  return onSnapshot(query(collection(db, C.MEMBERS), orderBy("createdAt", "asc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
}
export function listenBooks(cb) {
  return onSnapshot(query(collection(db, C.BOOKS), orderBy("createdAt", "asc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
}
export function listenCollections(cb) {
  return onSnapshot(query(collection(db, C.COLLECTIONS), orderBy("createdAt", "asc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
}
export function listenLogs(cb) {
  return onSnapshot(query(collection(db, C.LOGS), orderBy("createdAt", "desc")),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))));
}
