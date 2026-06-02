import { createContext, useContext, useState, useEffect } from "react";
import {
  listenMembers, listenBooks, listenCollections, listenLogs,
  addMember as fbAdd, updateMember as fbUpdate, deleteMember as fbDelete,
  addBook as fbAddBook, updateBook as fbUpdateBook,
  addCollection as fbAddCol, addLog as fbAddLog,
  seedConfig, getConfig,
} from "../firestoreService";

const AppContext = createContext(null);

const DEFAULT_ORG = {
  name: "Niranam Chudan Vallasamithi & NBC",
  reg: "Reg. PTM/TC/105/2022",
  event: "Mega Lucky Draw 2026",
  grandPrize: "Mega Lucky Draw",
  sponsor: "KGA Mall Changanassery",
  ticketPrice: 1000,
};

// Demo users - in production these come from Firebase Auth
export const DEMO_USERS = [
  { id: "u1", name: "Coordinator", email: "coordinator@nbc.com", password: "nbc2026", role: "super_admin" },
  { id: "u2", name: "Admin User",  email: "admin@nbc.com",       password: "admin123",role: "admin" },
  { id: "u3", name: "Member User", email: "member@nbc.com",      password: "mem123",  role: "member" },
  { id: "u4", name: "Viewer User", email: "viewer@nbc.com",      password: "view123", role: "viewer" },
];

export function AppProvider({ children }) {
  const [members, setMembers]         = useState([]);
  const [books, setBooks]             = useState([]);
  const [collections, setCollections] = useState([]);
  const [logs, setLogs]               = useState([]);
  const [org, setOrg]                 = useState(DEFAULT_ORG);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast]             = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    seedConfig().then(() => getConfig().then(cfg => { if (cfg) setOrg(o => ({ ...o, ...cfg })); }));
    const u1 = listenMembers(d => { setMembers(d); setLoading(false); });
    const u2 = listenBooks(setBooks);
    const u3 = listenCollections(setCollections);
    const u4 = listenLogs(setLogs);
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  function login(email, password) {
    const user = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (user) { setCurrentUser(user); return { success: true, user }; }
    return { success: false, error: "Invalid email or password" };
  }

  function logout() { setCurrentUser(null); }

  async function log(action, details) {
    if (!currentUser) return;
    const entry = { action, details, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, timestamp: new Date().toISOString() };
    try { await fbAddLog(entry); } catch (e) { /* silent */ }
  }

  // Permission helpers
  const can = {
    view:        () => true,
    addMember:   () => ["super_admin","admin","member"].includes(currentUser?.role),
    editMember:  () => ["super_admin","admin","member"].includes(currentUser?.role),
    deleteMember:() => currentUser?.role === "super_admin",
    assignBook:  () => ["super_admin","admin"].includes(currentUser?.role),
    collectCash: () => ["super_admin","admin","member"].includes(currentUser?.role),
    viewReports: () => ["super_admin","admin"].includes(currentUser?.role),
    downloadPDF: () => ["super_admin","admin"].includes(currentUser?.role),
    viewLogs:    () => currentUser?.role === "super_admin",
    manageUsers: () => currentUser?.role === "super_admin",
  };

  const data = { members, books, collections, logs, org, coordinator: { name: currentUser?.name || "Coordinator", role: currentUser?.role || "super_admin" } };

  async function addMember(m)       { try { await fbAdd(m);          await log("ADD_MEMBER",    `Added ${m.firstName} ${m.lastName}`); showToast("Member added"); }        catch(e){ showToast("Failed","error"); } }
  async function updateMember(id,u) { try { await fbUpdate(id,u);    await log("EDIT_MEMBER",   `Updated member ${id}`);              showToast("Member updated"); }       catch(e){ showToast("Failed","error"); } }
  async function deleteMember(id)   { try { await fbDelete(id);      await log("DELETE_MEMBER", `Deleted member ${id}`);              showToast("Member removed"); }       catch(e){ showToast("Failed","error"); } }
  async function addBook(b)         { try { await fbAddBook(b);      await log("ASSIGN_BOOK",   `Assigned book ${b.bookNumber}`);     showToast(`Book ${b.bookNumber} assigned`); } catch(e){ showToast("Failed","error"); } }
  async function updateBook(id,u)   { try { await fbUpdateBook(id,u);await log("EDIT_BOOK",     `Updated book ${id}`);                showToast("Book updated"); }         catch(e){ showToast("Failed","error"); } }
  async function addCollection(c)   { try { await fbAddCol(c);       await log("COLLECT_CASH",  `Collected Rs.${c.amount} for book ${c.bookId}`); showToast("Cash collected!"); } catch(e){ showToast("Failed","error"); } }

  return (
    <AppContext.Provider value={{ data, loading, currentUser, login, logout, can, addMember, updateMember, deleteMember, addBook, updateBook, addCollection, showToast, toast }}>
      {children}
      {toast && (
        <div style={{ position:"fixed", bottom:80, left:"50%", transform:"translateX(-50%)", background:toast.type==="success"?"#2e7d32":"#c62828", color:"#fff", padding:"10px 20px", borderRadius:10, fontSize:13, fontWeight:500, zIndex:9999, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
