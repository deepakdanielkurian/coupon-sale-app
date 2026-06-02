import { createContext, useContext, useState, useEffect } from "react";
import {
  listenMembers, listenBooks, listenCollections,
  addMember as fbAdd, updateMember as fbUpdate, deleteMember as fbDelete,
  addBook as fbAddBook, updateBook as fbUpdateBook,
  addCollection as fbAddCol, seedConfig, getConfig,
} from "../firestoreService";

const AppContext = createContext(null);

const DEFAULT_ORG = {
  name:"Niranam Chudan Vallasamithi & NBC", reg:"Reg. PTM/TC/105/2022",
  event:"Mega Lucky Draw 2026", grandPrize:"Maruti Suzuki Wagon R",
  sponsor:"KGA Mall Changanassery", ticketPrice:1000,
};
const DEFAULT_COORDINATOR = { name:"Coupon Coordinator", role:"Super Admin" };

export function AppProvider({ children }) {
  const [members, setMembers]         = useState([]);
  const [books, setBooks]             = useState([]);
  const [collections, setCollections] = useState([]);
  const [org, setOrg]                 = useState(DEFAULT_ORG);
  const [loading, setLoading]         = useState(true);
  const [toast, setToast]             = useState(null);

  function showToast(msg, type="success") {
    setToast({msg,type});
    setTimeout(()=>setToast(null),3000);
  }

  useEffect(() => {
    seedConfig().then(()=>getConfig().then(cfg=>{ if(cfg) setOrg(o=>({...o,...cfg})); }));
    const u1 = listenMembers(d=>{setMembers(d);setLoading(false);});
    const u2 = listenBooks(setBooks);
    const u3 = listenCollections(setCollections);
    return ()=>{u1();u2();u3();};
  },[]);

  const data = { members, books, collections, org, coordinator:DEFAULT_COORDINATOR };

  async function addMember(m)   { try{ await fbAdd(m);    showToast("Member added"); }     catch(e){ showToast("Failed","error"); } }
  async function updateMember(id,u){ try{ await fbUpdate(id,u); showToast("Member updated"); } catch(e){ showToast("Failed","error"); } }
  async function deleteMember(id){ try{ await fbDelete(id); showToast("Member removed"); }  catch(e){ showToast("Failed","error"); } }
  async function addBook(b)     { try{ await fbAddBook(b); showToast(`Book ${b.bookNumber} assigned`); } catch(e){ showToast("Failed","error"); } }
  async function updateBook(id,u){ try{ await fbUpdateBook(id,u); showToast("Book updated"); } catch(e){ showToast("Failed","error"); } }
  async function addCollection(c){ try{ await fbAddCol(c); showToast("Cash collected!"); }  catch(e){ showToast("Failed","error"); } }

  return (
    <AppContext.Provider value={{data,loading,addMember,updateMember,deleteMember,addBook,updateBook,addCollection,showToast,toast}}>
      {children}
      {toast && (
        <div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:toast.type==="success"?"#3B6D11":"#A32D2D",color:"#fff",padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:500,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.2)"}}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
}
export function useApp() { return useContext(AppContext); }
