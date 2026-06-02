import { createContext, useContext, useState, useEffect } from "react";

const SESSION_KEY = "nbc_coupon_session";
import {
  listenMembers, listenBooks, listenCollections, listenLogs,
  addMember as fbAdd, updateMember as fbUpdate, deleteMember as fbDelete,
  addBook as fbAddBook, updateBook as fbUpdateBook,
  addCollection as fbAddCol, addLog as fbAddLog,
  addAppUser as fbAddUser, updateAppUser as fbUpdateUser, deleteAppUser as fbDeleteUser,
  listenAppUsers, seedSuperAdmin,
  seedConfig, getConfig,
} from "../firestoreService";

const AppContext = createContext(null);

const DEFAULT_ORG = {
  name:"Niranam Chudan Vallasamithi & NBC", reg:"Reg. PTM/TC/105/2022",
  event:"Mega Lucky Draw 2026", grandPrize:"Mega Lucky Draw", ticketPrice:1000,
};

export function AppProvider({ children }) {
  const [members,    setMembers]    = useState([]);
  const [books,      setBooks]      = useState([]);
  const [collections,setCollections]= useState([]);
  const [logs,       setLogs]       = useState([]);
  const [appUsers,   setAppUsers]   = useState([]);
  const [org,        setOrg]        = useState(DEFAULT_ORG);
  const [loading,    setLoading]    = useState(true);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [toast,      setToast]      = useState(null);

  function showToast(msg, type="success") {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3200);
  }

  useEffect(()=>{
    seedConfig().then(()=>getConfig().then(cfg=>{ if(cfg) setOrg(o=>({...o,...cfg})); }));
    seedSuperAdmin(); // ensure super admin exists on first run
    const u1 = listenMembers(d=>{setMembers(d);setLoading(false);});
    const u2 = listenBooks(setBooks);
    const u3 = listenCollections(setCollections);
    const u4 = listenLogs(setLogs);
    const u5 = listenAppUsers(users => {
      setAppUsers(users);
      // Keep session in sync if current user data changed
      if (currentUser) {
        const fresh = users.find(u => u.id === currentUser.id);
        if (fresh) {
          setCurrentUser(fresh);
          localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
        }
      }
    });
    return ()=>{u1();u2();u3();u4();u5();};
  },[]);

  // ── Auth ─────────────────────────────────────────────────
  function login(email, password) {
    const user = appUsers.find(u => u.email.toLowerCase()===email.toLowerCase() && u.password===password);
    if (user) { setCurrentUser(user); localStorage.setItem(SESSION_KEY, JSON.stringify(user)); return { success:true, user }; }
    return { success:false, error:"Incorrect email or password" };
  }
  function logout() { setCurrentUser(null); localStorage.removeItem(SESSION_KEY); }

  // ── Activity log ─────────────────────────────────────────
  async function log(action, details) {
    if (!currentUser) return;
    try { await fbAddLog({ action, details, userId:currentUser.id, userName:currentUser.name, userRole:currentUser.role, timestamp:new Date().toISOString() }); }
    catch(e){ /* silent */ }
  }

  // ── Permissions ───────────────────────────────────────────
  const can = {
    view:         ()=>true,
    addMember:    ()=>["super_admin","admin","member"].includes(currentUser?.role),
    editMember:   ()=>["super_admin","admin","member"].includes(currentUser?.role),
    deleteMember: ()=>currentUser?.role==="super_admin",
    assignBook:   ()=>["super_admin","admin"].includes(currentUser?.role),
    collectCash:  ()=>["super_admin","admin","member"].includes(currentUser?.role),
    viewReports:  ()=>["super_admin","admin"].includes(currentUser?.role),
    downloadPDF:  ()=>["super_admin","admin"].includes(currentUser?.role),
    viewLogs:     ()=>currentUser?.role==="super_admin",
    manageUsers:  ()=>currentUser?.role==="super_admin",
  };

  const data = { members, books, collections, logs, org, coordinator:{ name:currentUser?.name||"Coordinator", role:currentUser?.role||"super_admin" } };

  // ── Member CRUD ───────────────────────────────────────────
  async function addMember(m)        { try{ await fbAdd(m);           await log("ADD_MEMBER",    `Added ${m.firstName} ${m.lastName}`);  showToast("Member added"); }       catch(e){ showToast("Failed","error"); } }
  async function updateMember(id,u)  { try{ await fbUpdate(id,u);     await log("EDIT_MEMBER",   `Updated ${id}`);                       showToast("Member updated"); }      catch(e){ showToast("Failed","error"); } }
  async function deleteMember(id)    { try{ await fbDelete(id);        await log("DELETE_MEMBER", `Deleted ${id}`);                       showToast("Member removed"); }      catch(e){ showToast("Failed","error"); } }

  // ── Book CRUD ─────────────────────────────────────────────
  async function addBook(b)          { try{ await fbAddBook(b);        await log("ASSIGN_BOOK",   `Book ${b.bookNumber}`);                showToast(`Book ${b.bookNumber} assigned`); } catch(e){ showToast("Failed","error"); } }
  async function updateBook(id,u)    { try{ await fbUpdateBook(id,u);  await log("EDIT_BOOK",     `Book ${id}`);                         showToast("Book updated"); }        catch(e){ showToast("Failed","error"); } }

  // ── Collection ────────────────────────────────────────────
  async function addCollection(c)    { try{ await fbAddCol(c);         await log("COLLECT_CASH",  `Rs.${c.amount} book ${c.bookId}`);    showToast("Cash collected!"); }     catch(e){ showToast("Failed","error"); } }

  // ── App users (super admin only) ──────────────────────────
  async function addUser(u)          { try{ const id=await fbAddUser(u); await log("CREATE_USER",`Created user ${u.email} (${u.role})`); showToast(`${u.name} created`); }  catch(e){ showToast("Failed","error"); } }
  async function updateUser(id,u)    { try{ await fbUpdateUser(id,u); if(currentUser&&id===currentUser.id){ const updated={...currentUser,...u}; setCurrentUser(updated); localStorage.setItem(SESSION_KEY,JSON.stringify(updated)); } await log("EDIT_USER",`Updated user ${id}`); showToast("User updated"); } catch(e){ showToast("Failed","error"); } }
  async function deleteUser(id)      { try{ await fbDeleteUser(id);    await log("DELETE_USER",  `Deleted user ${id}`);                  showToast("User removed"); }        catch(e){ showToast("Failed","error"); } }

  return (
    <AppContext.Provider value={{ data, loading, currentUser, appUsers, login, logout, can, addMember, updateMember, deleteMember, addBook, updateBook, addCollection, addUser, updateUser, deleteUser, showToast, toast }}>
      {children}
      {toast && (
        <div style={{ position:"fixed", bottom:84, left:"50%", transform:"translateX(-50%)", background:toast.type==="success"?"#2e7d32":"#c62828", color:"#fff", padding:"11px 22px", borderRadius:11, fontSize:13, fontWeight:600, zIndex:9999, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,0.18)", display:"flex", alignItems:"center", gap:8 }}>
          <i className={`ti ${toast.type==="success"?"ti-circle-check":"ti-circle-x"}`} style={{ fontSize:16 }}/>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() { return useContext(AppContext); }
