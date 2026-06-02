import { createContext, useContext, useState, useEffect } from "react";
import {
  listenMembers, listenBooks, listenCollections,
  addMember as fbAddMember, updateMember as fbUpdateMember, deleteMember as fbDeleteMember,
  addBook as fbAddBook, updateBook as fbUpdateBook,
  addCollection as fbAddCollection,
  seedConfig, getConfig,
} from "../firestoreService";
import { initialData } from "./store";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [org, setOrg] = useState(initialData.org);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    // Seed org config & load it
    seedConfig().then(() => getConfig().then(cfg => { if (cfg) setOrg(o => ({ ...o, ...cfg })); }));

    // Real-time listeners
    const unsubMembers = listenMembers(data => { setMembers(data); setLoading(false); });
    const unsubBooks = listenBooks(data => setBooks(data));
    const unsubCols = listenCollections(data => setCollections(data));

    return () => { unsubMembers(); unsubBooks(); unsubCols(); };
  }, []);

  const data = { members, books, collections, org, coordinator: initialData.coordinator };

  async function addMember(member) {
    try { await fbAddMember(member); showToast("Member added successfully"); }
    catch (e) { showToast("Failed to add member", "error"); }
  }

  async function updateMember(id, updates) {
    try { await fbUpdateMember(id, updates); showToast("Member updated"); }
    catch (e) { showToast("Failed to update member", "error"); }
  }

  async function deleteMember(id) {
    try { await fbDeleteMember(id); showToast("Member removed"); }
    catch (e) { showToast("Failed to delete member", "error"); }
  }

  async function addBook(book) {
    try { await fbAddBook(book); showToast(`Book ${book.bookNumber} assigned successfully`); }
    catch (e) { showToast("Failed to assign book", "error"); }
  }

  async function updateBook(id, updates) {
    try { await fbUpdateBook(id, updates); showToast("Book updated"); }
    catch (e) { showToast("Failed to update book", "error"); }
  }

  async function addCollection(col) {
    try { await fbAddCollection(col); showToast("Collection recorded"); }
    catch (e) { showToast("Failed to save collection", "error"); }
  }

  return (
    <AppContext.Provider value={{ data, loading, addMember, updateMember, deleteMember, addBook, updateBook, addCollection, showToast, toast }}>
      {children}
      {toast && (
        <div style={{
          position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "success" ? "#3B6D11" : "#A32D2D",
          color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13,
          fontWeight: 500, zIndex: 9999, whiteSpace: "nowrap",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        }}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
