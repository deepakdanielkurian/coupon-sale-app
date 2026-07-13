import { useState, useMemo } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getBookStats, fmt, initials } from "../data/store";
import { BOOK_SERIES, ALL_BOOKS, TICKET_PRICE, TOTAL_TICKETS, getSeriesFromBook, getSeriesSummary } from "../data/bookConfig";
import { fixBookTicketCount } from "../firestoreService";
import { Badge, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip, StatusBadge } from "../components/UI";
import EditBookModal from "./EditBookModal";
import TicketLookup from "./TicketLookup";
import EditCollectionModal from "./EditCollectionModal";

const GREEN = "#1a6b3c";

// ── Common ticket sell form ──────────────────────────────────
function SellCommonTicketForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const GREEN  = "#1a6b3c";
  const PURPLE = "#4a148c";

  // All previous sales for this book
  const bookCols = data.collections.filter(c => c.bookId === book.id);
  const totalSold = bookCols.reduce((s,c) => s+(c.ticketsSold||0), 0);
  const remaining = book.ticketCount - totalSold;

  // Set of every ticket number already sold — locked forever
  const soldNos = new Set(
    bookCols.flatMap(c => (c.ticketEntries||[]).map(e => Number(e.ticketNo)))
           .filter(n => !isNaN(n) && n > 0)
  );

  // Find next unsold ticket starting from n
  function nextUnsold(n) {
    while (n <= book.ticketTo) {
      if (!soldNos.has(n)) return n;
      n++;
    }
    return null;
  }

  const initNo = nextUnsold(book.ticketFrom) ?? book.ticketFrom;

  const [date,    setDate]   = useState(new Date().toISOString().split("T")[0]);
  const [payMode, setPayMode]= useState("cash");
  const [paidTo,  setPaidTo] = useState("coordinator");
  const [entries, setEntries]= useState([{ ticketNo: String(initNo), buyerName:"" }]);
  const [errors,  setErrors] = useState({});

  const isDirect    = paidTo === "treasurer";
  const filledCount = entries.filter(e => e.ticketNo && e.buyerName.trim()).length;
  const totalAmt    = entries.length * 1000;

  function updateEntry(i, key, val) {
    setEntries(prev => prev.map((e,idx) => idx===i ? {...e,[key]:val} : e));
    if (key === "ticketNo") {
      const n = Number(val);
      if (!isNaN(n) && soldNos.has(n)) {
        setErrors(prev => ({...prev, [`t${i}`]: "Already sold — pick another"}));
      } else {
        setErrors(prev => { const x={...prev}; delete x[`t${i}`]; return x; });
      }
    }
    if (key === "buyerName") {
      setErrors(prev => { const x={...prev}; delete x[`b${i}`]; return x; });
    }
  }

  function addEntry() {
    if (entries.length >= remaining) return;
    const currentNums = entries.map(e => Number(e.ticketNo)).filter(n => !isNaN(n) && n >= book.ticketFrom);
    const maxCurrent  = currentNums.length > 0 ? Math.max(...currentNums) : initNo - 1;
    const next        = nextUnsold(maxCurrent + 1) ?? nextUnsold(book.ticketFrom);
    setEntries(prev => [...prev, { ticketNo: next ? String(next) : "", buyerName:"" }]);
  }

  function removeEntry(i) {
    if (entries.length === 1) return;
    setEntries(prev => prev.filter((_,idx) => idx !== i));
    setErrors(prev => { const x={...prev}; delete x[`t${i}`]; delete x[`b${i}`]; return x; });
  }

  function validate() {
    const e = {};
    const usedInBatch = new Set();
    for (let i = 0; i < entries.length; i++) {
      const raw = String(entries[i].ticketNo).trim();
      const n   = Number(raw);
      if (!raw)                                        e[`t${i}`] = "Required";
      else if (isNaN(n)||n<book.ticketFrom||n>book.ticketTo) e[`t${i}`] = `Must be ${book.ticketFrom}–${book.ticketTo}`;
      else if (soldNos.has(n))                         e[`t${i}`] = "Already sold — pick another";
      else if (usedInBatch.has(n))                     e[`t${i}`] = "Duplicate in this batch";
      else                                             usedInBatch.add(n);
      if (!entries[i].buyerName.trim())                e[`b${i}`] = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onSave({
      id: `C-${Date.now()}`,
      bookId: book.id,
      memberId: null,
      isCommon: true,
      date,
      ticketsSold: entries.length,
      amount: entries.length * 1000,
      paymentMode: payMode,
      paidTo,
      verifiedByCoordinator: paidTo === "coordinator",
      ticketEntries: entries.map(e => ({ ticketNo: Number(e.ticketNo), buyerName: e.buyerName.trim(), amount: 1000 })),
      remarks: `Common book — ${entries.length} ticket(s)`,
    });
  }

  return (
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 12px 20px" }}>

      {/* Book info */}
      <div style={{ background:"#f3e5f5", borderRadius:11, border:"1px solid #ce93d830", padding:"10px 12px", marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:PURPLE }}>Common Book {book.bookNumber}</div>
            <div style={{ fontSize:10, color:"#7b1fa2", marginTop:2 }}>Tickets {book.ticketFrom}–{book.ticketTo}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:12, fontWeight:700, color:PURPLE }}>{remaining} remaining</div>
            <div style={{ fontSize:10, color:"#888" }}>{totalSold} sold of {book.ticketCount}</div>
          </div>
        </div>
        {soldNos.size > 0 && (
          <div style={{ marginTop:8, background:"rgba(74,20,140,0.08)", borderRadius:7, padding:"5px 8px", fontSize:10, color:PURPLE }}>
            <i className="ti ti-lock" style={{ marginRight:4, fontSize:11 }}/>
            {soldNos.size} ticket{soldNos.size!==1?"s":""} already sold and locked
          </div>
        )}
      </div>

      {/* Date */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Sale date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${PURPLE}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
      </div>

      {/* Live total */}
      <div style={{ background:PURPLE, borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>{entries.length} ticket{entries.length!==1?"s":""} · {filledCount} filled</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#fff" }}>{entries.length * 1000 === 0 ? "Rs.0" : `Rs.${(entries.length*1000).toLocaleString()}`}</div>
        </div>
        <div style={{ textAlign:"right", fontSize:10, color:"rgba(255,255,255,0.6)" }}>Rs.1,000 each</div>
      </div>

      {/* Ticket entries */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <div style={{ fontSize:11, fontWeight:700, color:PURPLE }}>Ticket entries</div>
        {entries.length < remaining && (
          <button onClick={addEntry}
            style={{ background:PURPLE, color:"#fff", border:"none", borderRadius:7, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:4 }}>
            <i className="ti ti-plus" style={{ fontSize:12 }}/> Add ticket
          </button>
        )}
      </div>

      {entries.map((entry, i) => {
        const n = Number(entry.ticketNo);
        const isSold = !isNaN(n) && soldNos.has(n);
        return (
          <div key={i} style={{ background:"#fff", borderRadius:10, border:`1px solid ${isSold?"#dc2626":errors[`t${i}`]||errors[`b${i}`]?"#fca5a5":"#eee"}`, padding:"10px 12px", marginBottom:8 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:PURPLE }}>Ticket {i+1}</div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                {entry.ticketNo&&entry.buyerName&&!isSold&&(
                  <span style={{ fontSize:9, fontWeight:700, background:"#f3e5f5", color:PURPLE, padding:"2px 6px", borderRadius:5 }}>✓ Filled</span>
                )}
                {isSold && (
                  <span style={{ fontSize:9, fontWeight:700, background:"#ffebee", color:"#dc2626", padding:"2px 6px", borderRadius:5 }}>
                    <i className="ti ti-lock" style={{ fontSize:9, marginRight:2 }}/>Sold
                  </span>
                )}
                {entries.length > 1 && (
                  <button onClick={()=>removeEntry(i)}
                    style={{ background:"#ffebee", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4, display:"flex", justifyContent:"space-between" }}>
                  <span>Ticket no.</span>
                  <span style={{ color:"#aaa", fontWeight:400, fontSize:9 }}>{book.ticketFrom}–{book.ticketTo}</span>
                </div>
                <input type="number" value={entry.ticketNo}
                  onChange={e => updateEntry(i, "ticketNo", e.target.value)}
                  placeholder={String(initNo + i)}
                  style={{ width:"100%", background:isSold?"#fff5f5":"#f8faf8", border:`1.5px solid ${isSold||errors[`t${i}`]?"#dc2626":entry.ticketNo?PURPLE:"#e0e0e0"}`, borderRadius:8, padding:"8px 9px", fontSize:14, fontWeight:700, color:isSold?"#dc2626":PURPLE, outline:"none", boxSizing:"border-box" }}/>
                {errors[`t${i}`] && <div style={{ fontSize:9, color:"#dc2626", marginTop:2 }}>{errors[`t${i}`]}</div>}
              </div>

              <div style={{ flex:2 }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Buyer name *</div>
                <input type="text" value={entry.buyerName}
                  onChange={e => updateEntry(i, "buyerName", e.target.value)}
                  placeholder="e.g. Rajan Kumar"
                  style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${errors[`b${i}`]?"#dc2626":entry.buyerName?PURPLE:"#e0e0e0"}`, borderRadius:8, padding:"8px 9px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
                {errors[`b${i}`] && <div style={{ fontSize:9, color:"#dc2626", marginTop:2 }}>{errors[`b${i}`]}</div>}
              </div>
            </div>
            <div style={{ marginTop:6, textAlign:"right", fontSize:10, color:"#888", fontWeight:600 }}>Rs.1,000</div>
          </div>
        );
      })}

      {entries.length < remaining && (
        <button onClick={addEntry}
          style={{ width:"100%", background:"#fff", color:PURPLE, border:`1.5px dashed ${PURPLE}`, borderRadius:10, padding:"10px", fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
          + Add another ticket
        </button>
      )}

      {/* Who received */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:6 }}>Who received this money? *</div>
        {[
          {key:"coordinator", label:"Coordinator (me)",   sub:"You collected directly",       badge:"In hand",     badgeBg:"#e8f5ee", badgeC:GREEN},
          {key:"treasurer",   label:"Treasurer directly", sub:"Buyer paid treasurer directly", badge:"Verify later",badgeBg:"#fff8e1", badgeC:"#f57c00"},
        ].map(opt=>{
          const sel=paidTo===opt.key, bc=opt.key==="treasurer"?"#e65100":GREEN;
          return(
            <div key={opt.key} onClick={()=>setPaidTo(opt.key)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:9,border:`${sel?"1.5px":"1px"} solid ${sel?bc:"#e0e0e0"}`,background:sel?opt.key==="treasurer"?"#fff8e1":"#f0f9f4":"#fff",marginBottom:5,cursor:"pointer" }}>
              <div style={{ width:17,height:17,borderRadius:"50%",border:`2px solid ${sel?bc:"#ccc"}`,background:sel?bc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {sel&&<div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:600,color:sel?bc:"#1a1a1a" }}>{opt.label}</div>
                <div style={{ fontSize:10,color:"#888" }}>{opt.sub}</div>
              </div>
              <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:6,background:opt.badgeBg,color:opt.badgeC }}>{opt.badge}</span>
            </div>
          );
        })}
      </div>

      {/* Payment mode */}
      <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:6 }}>Payment mode</div>
        <div style={{ display:"flex", gap:6 }}>
          {["cash","upi","bank"].map(m=>(
            <div key={m} onClick={()=>setPayMode(m)}
              style={{ flex:1, border:`${payMode===m?"2px":"1px"} solid ${payMode===m?isDirect?"#e65100":PURPLE:"#e0e0e0"}`, borderRadius:9, padding:"9px 4px", background:payMode===m?isDirect?"#fff8e1":"#f3e5f5":"#fff", textAlign:"center", fontSize:12, color:payMode===m?isDirect?"#e65100":PURPLE:"#888", fontWeight:payMode===m?700:400, cursor:"pointer" }}>
              <i className={`ti ${m==="cash"?"ti-cash":m==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:16, display:"block", marginBottom:3 }}/>
              {m.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <button onClick={submit}
        style={{ width:"100%", background:`linear-gradient(135deg,${PURPLE},#6a1b9a)`, color:"#fff", border:"none", borderRadius:11, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(74,20,140,0.3)", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
        <i className="ti ti-ticket" style={{ fontSize:16 }}/> Save {entries.length} ticket{entries.length!==1?"s":""} — Rs.{entries.length*1000}
      </button>
      <button onClick={onCancel}
        style={{ width:"100%", background:"#fff", color:"#888", border:"1px solid #e0e0e0", borderRadius:11, padding:"11px", fontSize:12, fontWeight:600, cursor:"pointer", marginTop:8 }}>
        Cancel
      </button>
    </div>
  );
}

// ── Regular Collect Cash Form ─────────────────────────────────
function CollectCashForm({ book, onSave, onStop, onCancel }) {
  const { data } = useApp();
  const stats    = getBookStats(book, data.collections);
  const member = data.members.find(m => m.id===book.memberId || m.memberId===book.memberId);
  const series   = getSeriesFromBook(book.bookNumber);
  const effective = stats.effective;
  const remaining = effective - stats.totalSold;

  const [date,        setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setSold]    = useState("");
  const [payMode,     setPayMode] = useState("cash");
  const [paidTo,      setPaidTo]  = useState("coordinator");
  const [remarks,     setRemarks] = useState("");
  const [showStop,    setShowStop]= useState(false);
  const isDirect = paidTo === "treasurer";
  const [stopRet,     setStopRet] = useState(String(remaining));
  const [stopNotes,   setStopNotes]= useState("");

  const tickets      = parseInt(ticketsSold)||0;
  const amount       = tickets * TICKET_PRICE;
  const newSold      = stats.totalSold + tickets;
  const newTotal     = stats.totalCollected + amount;
  const newPending   = Math.max(0, effective * TICKET_PRICE - newTotal);
  const pct          = effective > 0 ? Math.round((newSold/effective)*100) : 0;
  const willComplete = newSold >= effective;
  const stopRetNum   = parseInt(stopRet)||0;

  function submit() {
    if (!tickets||tickets<=0||tickets>remaining) return;
    onSave({ id:`C-${Date.now()}`, bookId:book.id, memberId:book.memberId, date, ticketsSold:tickets, amount, paymentMode:payMode, paidTo, verifiedByCoordinator: paidTo==="coordinator", remarks });
  }

  return (
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 12px 20px" }}>
      <div style={{ background:series?series.bg:"#f0ede8", borderRadius:12, padding:"12px 14px", marginBottom:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>{member?`${member.firstName} ${member.lastName}`:"—"}</div>
            <div style={{ fontSize:11, color:"#888" }}>Book {book.bookNumber} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
          </div>
          {series&&<span style={{ fontSize:10,fontWeight:700,color:series.color,background:"#fff",padding:"3px 8px",borderRadius:7 }}>{series.label}</span>}
        </div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6 }}>
          {[["Effective",effective],["Sold",stats.totalSold],["Left",remaining]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.7)",borderRadius:7,padding:"6px 8px",textAlign:"center" }}>
              <div style={{ fontSize:9,color:"#888" }}>{l}</div>
              <div style={{ fontSize:16,fontWeight:700,color:"#1a1a1a" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11 }}>
          <span style={{ color:GREEN,fontWeight:700 }}>Collected: {fmt(stats.totalCollected)}</span>
          <span style={{ color:stats.pending>0?"#e65100":GREEN }}>Pending: {fmt(stats.pending)}</span>
        </div>
      </div>

      <SectionLabel>Collection entry</SectionLabel>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:5 }}>Date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ width:"100%",background:"#fff",border:`1.5px solid ${GREEN}`,borderRadius:9,padding:"10px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
      </div>
      <InputField label={`Tickets sold this time *`} type="number" value={ticketsSold} onChange={setSold} required
        error={tickets>remaining?remaining>0?`Only ${remaining} ticket${remaining===1?"":"s"} left`:"":""}/>

      <div style={{ background:"#e8f5ee",borderRadius:10,padding:"12px 14px",marginBottom:10,border:"1px solid #a5d6a7" }}>
        <div style={{ fontSize:11,color:"#555",marginBottom:3 }}>Amount (auto-calculated)</div>
        <div style={{ fontSize:30,fontWeight:700,color:GREEN }}>{fmt(amount)}</div>
        <div style={{ fontSize:11,color:"#888" }}>{tickets} × Rs.1,000</div>
      </div>

      {tickets>0&&tickets<=remaining&&(
        <div style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>After this entry</div>
          {[["Tickets sold",`${newSold}/${effective}`],["Remaining",`${remaining-tickets} left`,remaining-tickets===0?GREEN:"#e65100"],["Collected",fmt(newTotal),GREEN],["Balance",fmt(newPending),newPending<=0?GREEN:"#e65100"],["Completion",`${pct}%`]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<arr.length-1?"1px solid #f5f5f5":"none",fontSize:11 }}>
              <span style={{ color:"#777" }}>{l}</span><span style={{ fontWeight:700,color:c||"#1a1a1a" }}>{v}</span>
            </div>
          ))}
          {willComplete&&<div style={{ marginTop:8,background:"#e8f5ee",borderRadius:8,padding:"7px 10px",display:"flex",gap:6 }}><i className="ti ti-trophy" style={{ color:GREEN,fontSize:15 }}/><span style={{ fontSize:11,color:GREEN,fontWeight:700 }}>Completes Book {book.bookNumber}! 🎉</span></div>}
        </div>
      )}

      {/* Stop selling button */}
      {!willComplete&&remaining>0&&!showStop&&(
        <button onClick={()=>setShowStop(true)}
          style={{ width:"100%",background:"#fff",color:"#e65100",border:"1.5px solid #e65100",borderRadius:9,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
          <i className="ti ti-player-stop" style={{ fontSize:14 }}/>Seller is stopping — return tickets
        </button>
      )}
      {showStop&&(
        <div style={{ background:"#fff8e1",borderRadius:10,border:"1.5px solid #ffe082",padding:"12px",marginBottom:10 }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#e65100",marginBottom:6 }}><i className="ti ti-player-stop" style={{ marginRight:5 }}/>Return unsold tickets</div>
          <div style={{ fontSize:10,color:"#bf360c",marginBottom:10,lineHeight:1.5 }}>Seller has {remaining} unsold tickets. Enter how many they are returning. Returned tickets won't count as pending.</div>
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:10,fontWeight:600,color:"#555",marginBottom:4 }}>Tickets returning (max {remaining})</div>
            <input type="number" min="0" max={remaining} value={stopRet} onChange={e=>setStopRet(e.target.value)}
              style={{ width:"100%",background:"#fff",border:"1.5px solid #e65100",borderRadius:8,padding:"9px 10px",fontSize:16,fontWeight:700,color:"#e65100",textAlign:"center",outline:"none",boxSizing:"border-box" }}/>
          </div>
          {stopRetNum>=0&&stopRetNum<=remaining&&(
            <div style={{ background:"#fff",borderRadius:8,padding:"8px 10px",marginBottom:8,border:"1px solid #ffe082",fontSize:11 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}><span style={{ color:"#777" }}>Sold</span><span style={{ fontWeight:700 }}>{stats.totalSold} tickets</span></div>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}><span style={{ color:"#777" }}>Returning</span><span style={{ fontWeight:700,color:"#e65100" }}>{stopRetNum} tickets</span></div>
              <div style={{ display:"flex",justifyContent:"space-between",borderTop:"0.5px solid #f5f5f5",paddingTop:4 }}><span style={{ color:"#777" }}>Balance due</span><span style={{ fontWeight:700,color:(effective-stopRetNum)*1000-stats.totalCollected<=0?GREEN:"#e65100" }}>{fmt(Math.max(0,(effective-stopRetNum)*1000-stats.totalCollected))}</span></div>
            </div>
          )}
          <input value={stopNotes} onChange={e=>setStopNotes(e.target.value)} placeholder="Reason (optional)"
            style={{ width:"100%",background:"#fff",border:"1px solid #e0e0e0",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",boxSizing:"border-box",marginBottom:8 }}/>
          <div style={{ display:"flex",gap:6 }}>
            <button onClick={()=>setShowStop(false)} style={{ flex:1,background:"#fff",color:"#888",border:"1px solid #e0e0e0",borderRadius:8,padding:"9px",fontSize:11,fontWeight:600,cursor:"pointer" }}>Cancel</button>
            <button onClick={()=>{ if(stopRetNum>=0&&stopRetNum<=remaining) onStop(stopRetNum,stopNotes); }}
              style={{ flex:2,background:"#e65100",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:11,fontWeight:700,cursor:"pointer" }}>
              <i className="ti ti-player-stop"/> Return {stopRetNum} & close book
            </button>
          </div>
        </div>
      )}

      {/* Who received? */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:6 }}>Who received this money? *</div>
        {[
          {key:"coordinator",label:"Coordinator (me)",   sub:"Cash or UPI paid to you directly",    badge:"In hand",     badgeBg:"#e8f5ee",badgeC:GREEN},
          {key:"treasurer",  label:"Treasurer directly", sub:"Member paid treasurer — bypasses you",badge:"Verify later",badgeBg:"#fff8e1",badgeC:"#f57c00"},
        ].map(opt=>{
          const sel=paidTo===opt.key, bc=opt.key==="treasurer"?"#e65100":GREEN;
          return(
            <div key={opt.key} onClick={()=>setPaidTo(opt.key)}
              style={{ display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:9,border:`${sel?"1.5px":"1px"} solid ${sel?bc:"#e0e0e0"}`,background:sel?opt.key==="treasurer"?"#fff8e1":"#f0f9f4":"#fff",marginBottom:5,cursor:"pointer" }}>
              <div style={{ width:17,height:17,borderRadius:"50%",border:`2px solid ${sel?bc:"#ccc"}`,background:sel?bc:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                {sel&&<div style={{ width:6,height:6,borderRadius:"50%",background:"#fff" }}/>}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:600,color:sel?bc:"#1a1a1a" }}>{opt.label}</div>
                <div style={{ fontSize:10,color:"#888" }}>{opt.sub}</div>
              </div>
              <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:6,background:opt.badgeBg,color:opt.badgeC }}>{opt.badge}</span>
            </div>
          );
        })}
        {isDirect&&(
          <div style={{ background:"#fff8e1",border:"1px solid #ffe082",borderRadius:8,padding:"7px 10px",display:"flex",gap:6 }}>
            <i className="ti ti-info-circle" style={{ color:"#f57c00",fontSize:13,flexShrink:0 }}/>
            <span style={{ fontSize:10,color:"#e65100",lineHeight:1.5 }}>Won't count in your coordinator balance until you verify in Remittance screen.</span>
          </div>
        )}
      </div>

      {/* Payment mode */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:6 }}>Payment mode</div>
        <div style={{ display:"flex",gap:6 }}>
          {["cash","upi","bank"].map(m=>(
            <div key={m} onClick={()=>setPayMode(m)}
              style={{ flex:1,border:`${payMode===m?"2px":"1px"} solid ${payMode===m?isDirect?"#e65100":GREEN:"#e0e0e0"}`,borderRadius:9,padding:"10px 4px",background:payMode===m?isDirect?"#fff8e1":"#e8f5ee":"#fff",textAlign:"center",fontSize:12,color:payMode===m?isDirect?"#e65100":GREEN:"#888",fontWeight:payMode===m?700:400,cursor:"pointer" }}>
              <i className={`ti ${m==="cash"?"ti-cash":m==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:16,display:"block",marginBottom:3 }}/>
              {m.toUpperCase()}
            </div>
          ))}
        </div>
      </div>
      <InputField label="Remarks (optional)" value={remarks} onChange={setRemarks} placeholder="e.g. 2 tickets returned..."/>
      <button onClick={submit} disabled={!tickets||tickets<=0||tickets>remaining}
        style={{ width:"100%",background:(!tickets||tickets<=0||tickets>remaining)?"#ccc":isDirect?"linear-gradient(135deg,#e65100,#bf360c)":"linear-gradient(135deg,#1a6b3c,#2e7d32)",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:13,fontWeight:700,cursor:(!tickets||tickets<=0||tickets>remaining)?"not-allowed":"pointer",boxShadow:(!tickets||tickets<=0||tickets>remaining)?"none":isDirect?"0 3px 10px rgba(230,81,0,0.3)":"0 3px 10px rgba(26,107,60,0.3)",marginTop:4,display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
        <i className={`ti ${isDirect?"ti-clock":"ti-cash"}`} style={{ fontSize:16 }}/>
        {!tickets||tickets<=0 ? "Enter tickets to collect" : tickets>remaining ? `Max ${remaining} remaining` : isDirect ? "Save — pending verification" : "Collect Cash"}
      </button>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Assign Book Form ──────────────────────────────────────────
function AssignBookForm({ onSave, onCancel }) {
  const { data, addMember } = useApp();
  const [memberId,   setMemberId]  = useState("");
  // Searchable member picker + inline create
  const [memberSearch, setMemberSearch] = useState("");
  const [showMemberList, setShowMemberList] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);
  const [newM, setNewM] = useState({ firstName:"", lastName:"", phone:"", label:"committee_member" });
  const [savingMember, setSavingMember] = useState(false);
  const [isCommon,   setIsCommon]  = useState(false);
  const [series,     setSeries]    = useState("");
  const [bookNumber, setBookNumber]= useState("");
  const [issueDate,  setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes,      setNotes]     = useState("");
  const [assigned,   setAssigned]  = useState([]);
  const [current,    setCurrent]   = useState("");
  const [errors,     setErrors]    = useState({});
  const [saved,      setSaved]     = useState(false);

  const member       = data.members.find(m => m.id === memberId);
  const seriesInfo   = series ? BOOK_SERIES[series] : null;
  const takenNums    = [...data.books.map(b=>b.bookNumber), ...assigned];
  const available    = ALL_BOOKS.filter(b=>b.series===series && !takenNums.includes(b.bookNumber));
  const memberDBBks  = memberId ? data.books.filter(b=>b.memberId===memberId) : [];

  function addBook() {
    if (!current || assigned.includes(current)) return;
    setAssigned(prev=>[...prev, current]);
    setCurrent("");
  }
  function removeBook(num) { setAssigned(prev=>prev.filter(b=>b!==num)); }

  // Filtered member list for search
  const filteredMembers = data.members.filter(m => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return true;
    return `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
        || (m.phone||"").includes(q)
        || (m.memberId||"").toLowerCase().includes(q);
  });

  async function handleCreateMember() {
    if (!newM.firstName.trim()) { return; }
    setSavingMember(true);
    const id = await addMember({
      firstName: newM.firstName.trim(),
      lastName:  newM.lastName.trim(),
      phone:     newM.phone.trim(),
      label:     newM.label,
      createdAt: new Date().toISOString().split("T")[0],
    });
    setSavingMember(false);
    if (id) {
      setMemberId(id);
      setCreatingMember(false);
      setShowMemberList(false);
      setMemberSearch("");
      setNewM({ firstName:"", lastName:"", phone:"", label:"committee_member" });
    }
  }

  function validate() {
    const e = {};
    if (!isCommon && !memberId) e.member="Select a member";
    if (!series) e.series="Select a series";
    if (assigned.length===0) e.books="Add at least one book";
    return e;
  }

  function handleSave() {
    const e = validate(); if (Object.keys(e).length){setErrors(e);return;}
    assigned.forEach(num=>{
      const bd = ALL_BOOKS.find(b=>b.bookNumber===num);
      if (!bd) return;
      // Use actual series from book number — never from form state (avoids wrong ticketCount)
      const actualSeries = getSeriesFromBook(num);
      onSave({ bookNumber:num, series:num[0], memberId:isCommon?null:memberId, isCommon, ticketCount:bd.ticketCount, ticketFrom:bd.ticketFrom, ticketTo:bd.ticketTo, issueDate, status:"not_started", notes });
    });
    setSaved(true);
  }

  if (saved) return (
    <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,background:"#f5f7f5" }}>
      <div style={{ width:64,height:64,borderRadius:"50%",background:isCommon?"#f3e5f5":"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16 }}>
        <i className="ti ti-circle-check" style={{ fontSize:36,color:isCommon?"#4a148c":GREEN }}/>
      </div>
      <div style={{ fontSize:16,fontWeight:700,color:"#1a1a1a",marginBottom:4 }}>{assigned.length} book{assigned.length>1?"s":""} assigned!</div>
      <div style={{ fontSize:12,color:"#888",marginBottom:20 }}>{isCommon?"Common pool":"To "+member?.firstName+" "+member?.lastName}</div>
      {assigned.map(num=>{const bd=ALL_BOOKS.find(b=>b.bookNumber===num);const s=getSeriesFromBook(num);return(
        <div key={num} style={{ background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"8px 12px",marginBottom:6,width:"100%",display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ width:28,height:28,borderRadius:7,background:isCommon?"#f3e5f5":s?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:isCommon?"#4a148c":s?.color,fontSize:12 }}>{num[0]}</div>
          <div><div style={{ fontSize:12,fontWeight:700 }}>Book {num}</div><div style={{ fontSize:10,color:"#888" }}>Tickets {bd?.ticketFrom}–{bd?.ticketTo}</div></div>
          <div style={{ marginLeft:"auto",fontSize:12,fontWeight:700,color:GREEN }}>{fmt((s?.ticketsPerBook||bd?.ticketCount||0)*1000)}</div>
        </div>
      );})}
      <button onClick={onCancel} style={{ width:"100%",marginTop:16,background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:11,padding:13,fontSize:13,fontWeight:700,cursor:"pointer" }}>Done</button>
    </div>
  );

  return (
    <div style={{ background:"#f5f7f5",flex:1,overflowY:"auto",padding:"12px 12px 20px" }}>

      {/* Common or Member toggle */}
      <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>Book type</div>
        <div style={{ display:"flex",gap:8 }}>
          <div onClick={()=>{setIsCommon(false);}} style={{ flex:1,border:`2px solid ${!isCommon?GREEN:"#e0e0e0"}`,borderRadius:10,padding:"10px 8px",background:!isCommon?"#e8f5ee":"#fff",cursor:"pointer",textAlign:"center" }}>
            <i className="ti ti-user" style={{ fontSize:20,color:!isCommon?GREEN:"#bbb",display:"block",marginBottom:4 }}/>
            <div style={{ fontSize:11,fontWeight:700,color:!isCommon?GREEN:"#888" }}>Assign to member</div>
            <div style={{ fontSize:9,color:"#aaa",marginTop:2 }}>Regular book for a member</div>
          </div>
          <div onClick={()=>{setIsCommon(true);setMemberId("");}} style={{ flex:1,border:`2px solid ${isCommon?"#4a148c":"#e0e0e0"}`,borderRadius:10,padding:"10px 8px",background:isCommon?"#f3e5f5":"#fff",cursor:"pointer",textAlign:"center" }}>
            <i className="ti ti-pool" style={{ fontSize:20,color:isCommon?"#4a148c":"#bbb",display:"block",marginBottom:4 }}/>
            <div style={{ fontSize:11,fontWeight:700,color:isCommon?"#4a148c":"#888" }}>Common book</div>
            <div style={{ fontSize:9,color:"#aaa",marginTop:2 }}>Coordinator sells individually</div>
          </div>
        </div>
        {isCommon&&(
          <div style={{ marginTop:8,background:"#f3e5f5",borderRadius:8,padding:"7px 10px",display:"flex",gap:7 }}>
            <i className="ti ti-info-circle" style={{ color:"#4a148c",fontSize:14,flexShrink:0 }}/>
            <span style={{ fontSize:11,color:"#4a148c",lineHeight:1.5 }}>Common books are managed by you (coordinator). Each ticket is sold individually with the buyer's name recorded.</span>
          </div>
        )}
      </div>

      {/* Member select — only if not common */}
      {!isCommon&&(
        <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>Step 1 — Select member</div>

          {/* Selected member chip */}
          {member && !creatingMember && (
            <div style={{ display:"flex",alignItems:"center",gap:10,background:"#f0f9f4",border:`1.5px solid ${GREEN}`,borderRadius:9,padding:"8px 10px",marginBottom:8 }}>
              <div style={{ width:32,height:32,borderRadius:9,background:LABELS[member.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:LABELS[member.label]?.color,flexShrink:0 }}>{initials(member)}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{member.firstName} {member.lastName}</div><span style={{ fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:5,background:LABELS[member.label]?.bg,color:LABELS[member.label]?.color }}>{LABELS[member.label]?.label}</span></div>
              <div style={{ fontSize:11,fontWeight:700,color:"#2C2C2A",marginRight:6 }}>{memberDBBks.length} book{memberDBBks.length!==1?"s":""}</div>
              <button onClick={()=>{setMemberId("");setShowMemberList(false);}} style={{ background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:16 }}>✕</button>
            </div>
          )}

          {/* Search box + dropdown (when no member selected) */}
          {!member && !creatingMember && (
            <div style={{ position:"relative" }}>
              <div style={{ display:"flex",alignItems:"center",background:"#f8faf8",border:`1.5px solid ${errors.member?"#dc2626":"#e0e0e0"}`,borderRadius:9,padding:"2px 10px" }}>
                <i className="ti ti-search" style={{ color:"#aaa",fontSize:15 }}/>
                <input
                  value={memberSearch}
                  onChange={e=>{setMemberSearch(e.target.value);setShowMemberList(true);}}
                  onFocus={()=>setShowMemberList(true)}
                  placeholder="Search member by name or phone..."
                  style={{ flex:1,background:"transparent",border:"none",padding:"9px 8px",fontSize:13,outline:"none" }}/>
              </div>
              {errors.member&&<div style={{ fontSize:10,color:"#dc2626",marginTop:3 }}>{errors.member}</div>}

              {showMemberList && (
                <div style={{ marginTop:6,maxHeight:240,overflowY:"auto",border:"1px solid #eee",borderRadius:9,background:"#fff" }}>
                  {filteredMembers.length===0 && (
                    <div style={{ padding:"12px",textAlign:"center",fontSize:11,color:"#aaa" }}>No members match "{memberSearch}"</div>
                  )}
                  {filteredMembers.map(m=>(
                    <div key={m.id} onClick={()=>{setMemberId(m.id);setShowMemberList(false);setMemberSearch("");setErrors(v=>({...v,member:""}));}}
                      style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderBottom:"0.5px solid #f5f5f5",cursor:"pointer" }}>
                      <div style={{ width:28,height:28,borderRadius:7,background:LABELS[m.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:LABELS[m.label]?.color,flexShrink:0 }}>{initials(m)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:600,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div>
                        <div style={{ fontSize:10,color:"#888" }}>{LABELS[m.label]?.label}{m.phone?` · ${m.phone}`:""}</div>
                      </div>
                    </div>
                  ))}
                  {/* Add new member option */}
                  <div onClick={()=>{setCreatingMember(true);setShowMemberList(false);setNewM(v=>({...v,firstName:memberSearch.trim()}));}}
                    style={{ display:"flex",alignItems:"center",gap:9,padding:"10px",cursor:"pointer",background:"#f0f9f4" }}>
                    <div style={{ width:28,height:28,borderRadius:7,background:GREEN,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <i className="ti ti-plus" style={{ color:"#fff",fontSize:16 }}/>
                    </div>
                    <div style={{ fontSize:12,fontWeight:700,color:GREEN }}>Create new member{memberSearch.trim()?` "${memberSearch.trim()}"`:""}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inline create member form */}
          {creatingMember && (
            <div style={{ background:"#f0f9f4",border:`1.5px solid ${GREEN}`,borderRadius:10,padding:"12px" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
                <div style={{ fontSize:12,fontWeight:700,color:GREEN }}><i className="ti ti-user-plus" style={{ marginRight:5 }}/>New member</div>
                <button onClick={()=>setCreatingMember(false)} style={{ background:"none",border:"none",color:"#999",cursor:"pointer",fontSize:16 }}>✕</button>
              </div>
              <div style={{ display:"flex",gap:8,marginBottom:8 }}>
                <input value={newM.firstName} onChange={e=>setNewM(v=>({...v,firstName:e.target.value}))} placeholder="First name *"
                  style={{ flex:1,background:"#fff",border:`1.5px solid ${newM.firstName?GREEN:"#e0e0e0"}`,borderRadius:8,padding:"9px 10px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
                <input value={newM.lastName} onChange={e=>setNewM(v=>({...v,lastName:e.target.value}))} placeholder="Last name"
                  style={{ flex:1,background:"#fff",border:"1.5px solid #e0e0e0",borderRadius:8,padding:"9px 10px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
              </div>
              <input value={newM.phone} onChange={e=>setNewM(v=>({...v,phone:e.target.value}))} placeholder="Phone (optional)"
                style={{ width:"100%",background:"#fff",border:"1.5px solid #e0e0e0",borderRadius:8,padding:"9px 10px",fontSize:13,outline:"none",boxSizing:"border-box",marginBottom:8 }}/>
              <div style={{ fontSize:10,fontWeight:600,color:"#555",marginBottom:5 }}>Category</div>
              <div style={{ display:"flex",flexWrap:"wrap",gap:5,marginBottom:10 }}>
                {Object.entries(LABELS).filter(([k])=>k!=="common").map(([k,v])=>(
                  <div key={k} onClick={()=>setNewM(p=>({...p,label:k}))}
                    style={{ border:`1.5px solid ${newM.label===k?v.color:"#e0e0e0"}`,borderRadius:7,padding:"5px 9px",fontSize:10,fontWeight:600,cursor:"pointer",background:newM.label===k?v.bg:"#fff",color:newM.label===k?v.color:"#888" }}>
                    {v.label}
                  </div>
                ))}
              </div>
              <button onClick={handleCreateMember} disabled={savingMember||!newM.firstName.trim()}
                style={{ width:"100%",background:(savingMember||!newM.firstName.trim())?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:9,padding:"10px",fontSize:12,fontWeight:700,cursor:(savingMember||!newM.firstName.trim())?"not-allowed":"pointer" }}>
                <i className="ti ti-check" style={{ marginRight:5 }}/>{savingMember?"Creating...":"Create & select"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Series select */}
      <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>
          {isCommon?"Step 1":"Step 2"} — Select series
        </div>
        {errors.series&&<div style={{ fontSize:10,color:"#dc2626",marginBottom:5 }}>{errors.series}</div>}
        <div style={{ display:"flex",gap:6 }}>
          {Object.entries(BOOK_SERIES).map(([key,s])=>{
            const rem=ALL_BOOKS.filter(b=>b.series===key&&!takenNums.includes(b.bookNumber)).length;
            return(
              <div key={key} onClick={()=>{setSeries(key);setCurrent("");setErrors(v=>({...v,series:""}));}}
                style={{ flex:1,border:`${series===key?"2px":"1px"} solid ${series===key?isCommon?"#4a148c":GREEN:"#e0e0e0"}`,borderRadius:10,padding:"10px 6px",background:series===key?isCommon?"#f3e5f5":"#e8f5ee":"#fff",cursor:"pointer",textAlign:"center",transition:"all 0.15s" }}>
                <div style={{ width:28,height:28,borderRadius:7,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px",fontSize:14,fontWeight:700,color:s.color }}>{key}</div>
                <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a" }}>{s.ticketsPerBook}t</div>
                <div style={{ fontSize:9,color:"#aaa",marginTop:1 }}>{rem} left</div>
              </div>
            );
          })}
        </div>
        {seriesInfo&&<div style={{ marginTop:8,background:seriesInfo.bg,borderRadius:8,padding:"7px 10px" }}><div style={{ fontSize:10,fontWeight:600,color:seriesInfo.color }}>{seriesInfo.name} · {seriesInfo.ticketsPerBook} tickets/book · {available.length} available</div></div>}
      </div>

      {/* Book number select + add */}
      {seriesInfo&&(
        <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>
            {isCommon?"Step 2":"Step 3"} — Add books
          </div>
          {errors.books&&<div style={{ fontSize:10,color:"#dc2626",marginBottom:5 }}>{errors.books}</div>}
          <div style={{ display:"flex",gap:8,marginBottom:8 }}>
            <select value={current} onChange={e=>setCurrent(e.target.value)}
              style={{ flex:1,background:"#f8faf8",border:`1.5px solid ${current?isCommon?"#4a148c":GREEN:"#e0e0e0"}`,borderRadius:9,padding:"10px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}>
              <option value="">— select book number —</option>
              {available.slice(0,200).map(b=><option key={b.bookNumber} value={b.bookNumber}>{b.bookNumber} (Tickets {b.ticketFrom}–{b.ticketTo})</option>)}
            </select>
            <button onClick={addBook} disabled={!current}
              style={{ background:current?isCommon?"#4a148c":GREEN:"#e0e0e0",color:"#fff",border:"none",borderRadius:9,padding:"0 14px",fontSize:13,fontWeight:700,cursor:current?"pointer":"not-allowed",flexShrink:0 }}>
              <i className="ti ti-plus" style={{ fontSize:16 }}/> Add
            </button>
          </div>
          {current&&(()=>{const bd=ALL_BOOKS.find(b=>b.bookNumber===current);return bd?(<div style={{ background:"#f8faf8",borderRadius:8,padding:"7px 10px",marginBottom:8,display:"flex",alignItems:"center",gap:7,fontSize:11,color:"#555" }}><i className="ti ti-lock" style={{ color:GREEN,fontSize:13 }}/> Tickets <strong style={{ color:isCommon?"#4a148c":GREEN }}>{bd.ticketFrom}</strong> to <strong style={{ color:isCommon?"#4a148c":GREEN }}>{bd.ticketTo}</strong> (auto-assigned · read-only)</div>):null;})()}
          {assigned.length>0&&(
            <div>
              <div style={{ fontSize:11,fontWeight:700,color:isCommon?"#4a148c":GREEN,marginBottom:6 }}><i className="ti ti-circle-check" style={{ fontSize:13,marginRight:4 }}/>{assigned.length} book{assigned.length>1?"s":""} added</div>
              {assigned.map(num=>{const bd=ALL_BOOKS.find(b=>b.bookNumber===num);const s=getSeriesFromBook(num);return(
                <div key={num} style={{ display:"flex",alignItems:"center",gap:8,background:isCommon?"#f3e5f5":"#e8f5ee",borderRadius:8,border:`1px solid ${isCommon?"#ce93d8":"#a5d6a7"}`,padding:"8px 10px",marginBottom:6 }}>
                  <div style={{ width:26,height:26,borderRadius:6,background:s?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:s?.color,fontSize:11,flexShrink:0 }}>{num[0]}</div>
                  <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>Book {num}</div><div style={{ fontSize:10,color:"#555" }}>Tickets {bd?.ticketFrom}–{bd?.ticketTo}</div></div>
                  <div style={{ fontSize:11,fontWeight:700,color:GREEN }}>{fmt((ALL_BOOKS.find(b=>b.bookNumber===num)?.ticketCount||0)*1000)}</div>
                  <button onClick={()=>removeBook(num)} style={{ background:"#ffebee",border:"1px solid #fca5a5",color:"#dc2626",borderRadius:6,padding:"3px 7px",fontSize:10,cursor:"pointer" }}>✕</button>
                </div>
              );})}
              <div style={{ background:"#1a1a1a",borderRadius:8,padding:"8px 12px",marginTop:4,display:"flex",justifyContent:"space-between" }}>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)" }}>
                  {assigned.length} book{assigned.length>1?"s":""} · {assigned.reduce((s,n)=>{ const b=ALL_BOOKS.find(x=>x.bookNumber===n); return s+(b?.ticketCount||0); },0)} tickets
                </div>
                <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>
                  {fmt(assigned.reduce((s,n)=>{ const b=ALL_BOOKS.find(x=>x.bookNumber===n); return s+(b?.ticketCount||0)*1000; },0))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {assigned.length>0&&(
        <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"12px 14px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>
            {isCommon?"Step 3":"Step 4"} — Issue details
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:5 }}>Issue date *</div>
            <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)}
              style={{ width:"100%",background:"#f8faf8",border:`1.5px solid ${GREEN}`,borderRadius:9,padding:"10px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
          </div>
          <InputField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any instructions..."/>
        </div>
      )}

      <PrimaryButton onClick={handleSave} disabled={assigned.length===0||((!isCommon)&&!memberId)}>
        <i className="ti ti-ticket"/> {isCommon?"Set as common":"Issue"} {assigned.length>0?`${assigned.length} book${assigned.length>1?"s":""}`:""}{!isCommon&&member?` to ${member.firstName}`:""}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Main Books Screen ─────────────────────────────────────────
export default function BooksScreen({ triggerCollect }) {
  const { data, addBook, addCollection, stopSelling, resetBook } = useApp();
  const [view,   setView]  = useState("list");
  const [selBook,setBook]  = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [editingCol,  setEditingCol]  = useState(null);
  const [fSeries,setFS]    = useState("all");
  const [fStatus,setFSt]   = useState("all");
  const [fType,  setFType] = useState("all"); // all | common | member
  const [search, setSearch]= useState("");

  const filtered = useMemo(()=>{
    const result = data.books.filter(b=>{
      const sm = fSeries==="all"||b.series===fSeries||b.bookNumber?.startsWith(fSeries);
      const st = fStatus==="all"||b.status===fStatus;
      const tp = fType==="all"||(fType==="common"&&b.isCommon)||(fType==="member"&&!b.isCommon);
      const member = data.members.find(m=>m.id===b.memberId);
      const memberName = member?`${member.firstName} ${member.lastName}`.toLowerCase():"";
      const sq = !search||(b.bookNumber?.toLowerCase().includes(search.toLowerCase())||memberName.includes(search.toLowerCase()));
      return sm&&st&&tp&&sq;
    });
    // Common books always at top
    return [...result.filter(b=>b.isCommon), ...result.filter(b=>!b.isCommon)];
  },[data.books,data.members,data.collections,fSeries,fStatus,fType,search]);

  const totalCollected = data.collections.reduce((s,c)=>s+(c.amount||0),0);
  const soldTickets    = data.collections.reduce((s,c)=>s+(c.ticketsSold||0),0);
  const commonBooks    = data.books.filter(b=>b.isCommon);

  const Header=({title,sub,onBack})=>(
    <div style={{ background:GREEN,padding:"10px 14px 12px",display:"flex",alignItems:"center",gap:10 }}>
      {onBack&&<button onClick={onBack} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0 }}><i className="ti ti-arrow-left"/></button>}
      <div><div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>{title}</div>{sub&&<div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>{sub}</div>}</div>
    </div>
  );

  if (view==="assign") return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <Header title="Assign coupon book" sub="Regular member or common pool" onBack={()=>setView("list")}/>
      <AssignBookForm onSave={b=>{addBook(b);}} onCancel={()=>setView("list")}/>
    </div>
  );
  if (view==="collect"&&selBook) return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <Header title="Collect Cash" sub={`Book ${selBook.bookNumber}`} onBack={()=>setView("list")}/>
      <CollectCashForm book={selBook} onSave={col=>{addCollection(col);setView("list");}} onStop={(ret,notes)=>{stopSelling(selBook.id,ret,notes);setView("list");}} onCancel={()=>setView("list")}/>
    </div>
  );
  if (view==="common"&&selBook) return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <Header title="Sell common tickets" sub={`Book ${selBook.bookNumber} · Buyer names required`} onBack={()=>setView("list")}/>
      <SellCommonTicketForm book={selBook} onSave={col=>{addCollection(col);setView("list");}} onCancel={()=>setView("list")}/>
    </div>
  );

  // Ticket lookup screen
  if (view==="ticket") return <TicketLookup onClose={()=>setView("list")}/>;

  return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      {editingBook&&<EditBookModal book={editingBook} onClose={()=>setEditingBook(null)}/>}
      {editingCol&&<EditCollectionModal col={editingCol} book={data.books.find(b=>b.id===editingCol.bookId)} onClose={()=>setEditingCol(null)}/>}
      <div style={{ background:GREEN,padding:"10px 14px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10 }}>
        <div>
          <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Coupon books</div>
          <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>494 books · 10,000 tickets · Rs.1,000 each</div>
        </div>
        <button onClick={()=>setView("ticket")}
          style={{ background:"rgba(255,255,255,0.18)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",borderRadius:8,padding:"7px 11px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
          <i className="ti ti-search" style={{ fontSize:14 }}/>Find ticket
        </button>
      </div>
      <div style={{ background:"#f5f7f5",flex:1,overflowY:"auto",padding:"10px 12px 4px" }}>

        {/* Assign button */}
        <button onClick={()=>setView("assign")} style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(26,107,60,0.25)" }}>
          <i className="ti ti-ticket" style={{ fontSize:17 }}/> Assign new book
        </button>

        {/* Search */}
        <div style={{ background:"#fff",borderRadius:9,border:"1px solid #eee",display:"flex",alignItems:"center",padding:"0 10px",gap:6,marginBottom:10 }}>
          <i className="ti ti-search" style={{ color:"#ccc",fontSize:15 }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by book number or member name..."
            style={{ flex:1,border:"none",outline:"none",fontSize:12,color:"#1a1a1a",background:"transparent",padding:"10px 0" }}/>
          {search&&<button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",color:"#aaa",padding:0 }}><i className="ti ti-x" style={{ fontSize:14 }}/></button>}
        </div>

        {/* Grand totals */}
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10 }}>
          {[{label:"Total collected",value:fmt(totalCollected),color:GREEN},{label:"Books assigned",value:`${data.books.length}/500`,color:"#1a1a1a"},{label:"Tickets sold",value:`${soldTickets}/${TOTAL_TICKETS}`,color:"#1a1a1a"},{label:"Common books",value:commonBooks.length,color:"#4a148c"}].map((s,i)=>(
            <div key={i} style={{ background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"8px 10px" }}>
              <div style={{ fontSize:10,color:"#aaa" }}>{s.label}</div>
              <div style={{ fontSize:15,fontWeight:700,color:s.color,marginTop:2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Series overview */}
        <SectionLabel>Series overview</SectionLabel>
        {getSeriesSummary(data.books,data.collections).map(s=>{
          const pct=Math.round((s.soldTickets/s.totalTickets)*100);
          return(
            <div key={s.key} style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:7 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                <div style={{ width:30,height:30,borderRadius:7,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:s.color,flexShrink:0 }}>{s.key}</div>
                <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{s.name} · {s.ticketsPerBook}t/book</div><div style={{ fontSize:10,color:"#aaa" }}>{s.totalBooks} books · {s.ticketsPerBook} tickets each</div></div>
                <div style={{ textAlign:"right" }}><div style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(s.collected)}</div><div style={{ fontSize:10,color:"#aaa" }}>{s.assignedBooks}/{s.totalBooks}</div></div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:5 }}>
                <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:pct===100?GREEN:s.color,borderRadius:3 }}/></div>
                <span style={{ fontSize:9,color:"#aaa" }}>{s.soldTickets}/{s.totalTickets}</span>
              </div>
            </div>
          );
        })}

        {/* Filters */}
        <div style={{ display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" }}>
          {["all","A","B","C"].map(s=><div key={s} onClick={()=>setFS(s)} style={{ background:fSeries===s?GREEN:"#fff",color:fSeries===s?"#fff":"#666",border:`1px solid ${fSeries===s?GREEN:"#e0e0e0"}`,borderRadius:14,padding:"4px 11px",fontSize:10,fontWeight:fSeries===s?700:400,cursor:"pointer" }}>{s==="all"?"All series":`${s} series`}</div>)}
        </div>
        <div style={{ display:"flex",gap:4,marginBottom:6,flexWrap:"wrap" }}>
          {[["all","All"],["member","Member books"],["common","Common books"]].map(([v,l])=><div key={v} onClick={()=>setFType(v)} style={{ background:fType===v?"#4a148c":"#fff",color:fType===v?"#fff":"#666",border:`1px solid ${fType===v?"#4a148c":"#e0e0e0"}`,borderRadius:14,padding:"4px 11px",fontSize:10,fontWeight:fType===v?700:400,cursor:"pointer" }}>{l}</div>)}
        </div>
        <div style={{ display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" }}>
          {[["all","All status"],["not_started","Not started"],["ongoing","Ongoing"],["complete","Complete"]].map(([v,l])=><div key={v} onClick={()=>setFSt(v)} style={{ background:fStatus===v?"#333":"#fff",color:fStatus===v?"#fff":"#666",border:`1px solid ${fStatus===v?"#333":"#e0e0e0"}`,borderRadius:14,padding:"4px 11px",fontSize:10,fontWeight:fStatus===v?700:400,cursor:"pointer" }}>{l}</div>)}
        </div>

        <SectionLabel>Books ({filtered.length})</SectionLabel>
        {/* Detect books with wrong ticketCount and offer fix */}
        {filtered.some(book=>{
          const expected=getSeriesFromBook(book.bookNumber)?.ticketsPerBook;
          return expected && book.ticketCount!==expected;
        })&&(
          <div style={{ background:"#fff8e1",border:"1px solid #ffe082",borderRadius:9,padding:"9px 11px",marginBottom:10 }}>
            <div style={{ display:"flex",alignItems:"flex-start",gap:7,marginBottom:8 }}>
              <i className="ti ti-alert-triangle" style={{ color:"#e65100",fontSize:15,flexShrink:0 }}/>
              <span style={{ fontSize:11,color:"#e65100",lineHeight:1.5 }}>Some books have wrong ticket count (saved incorrectly). Tap <strong>Fix</strong> to correct each one.</span>
            </div>
          </div>
        )}
        {filtered.length===0&&<div style={{ textAlign:"center",color:"#aaa",fontSize:12,padding:"24px 0" }}>No books found</div>}

        {filtered.map(book=>{
          const stats  = getBookStats(book,data.collections);
          // Check Firestore doc ID first, then the NCB-2026-xxx field stored in member data
          const member = data.members.find(m => {
            if (!book.memberId) return false;
            return m.id === book.memberId || m.memberId === book.memberId;
          });
          // Original owner (if book was handed over)
          const origOwner = book.originalMemberId && book.originalMemberId !== book.memberId
            ? data.members.find(m => m.id === book.originalMemberId || m.memberId === book.originalMemberId)
            : null;
          const pct    = Math.round((stats.totalSold/book.ticketCount)*100);
          const s      = getSeriesFromBook(book.bookNumber);
          const barC   = book.status==="complete"?GREEN:book.status==="ongoing"?"#4caf50":"#e53935";
          return(
            <div key={book.id} style={{ background:"#fff",borderRadius:11,border:`1px solid ${book.isCommon?"#ce93d8":"#eee"}`,padding:"10px 12px",marginBottom:8 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
                <div style={{ width:36,height:36,borderRadius:9,background:book.isCommon?"#f3e5f5":s?s.bg:"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:book.isCommon?"#4a148c":s?s.color:"#aaa",flexShrink:0 }}>{book.bookNumber?.charAt(0)}</div>
                <div style={{ flex:1 }}>
                  {/* Name first, then book details */}
                  <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a" }}>
                    {book.isCommon?"Common pool":member?`${member.firstName} ${member.lastName}`:"—"}
                    {origOwner&&<span style={{ marginLeft:6,fontSize:9,fontWeight:600,background:"#e3f2fd",color:"#1565c0",padding:"1px 6px",borderRadius:4 }}>from {origOwner.firstName}</span>}
                  </div>
                  <div style={{ fontSize:10,color:"#aaa",marginTop:1 }}>
                    Book {book.bookNumber} · Tickets {book.ticketFrom}–{book.ticketTo}
                    {book.isCommon&&<span style={{ marginLeft:5,background:"#4a148c",color:"#fff",fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:4 }}>COMMON</span>}
                  </div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:5,flexShrink:0 }}>
                  <StatusBadge status={book.status} stopped={book.stoppedSelling}/>
                  {(()=>{ const expected=getSeriesFromBook(book.bookNumber)?.ticketsPerBook; return expected&&book.ticketCount!==expected?(<button onClick={async(e)=>{e.stopPropagation();await fixBookTicketCount(book.id,expected);}} style={{ background:"#fff8e1",color:"#e65100",border:"1px solid #ffe082",borderRadius:6,padding:"2px 8px",fontSize:10,fontWeight:700,cursor:"pointer" }}>Fix</button>):null; })()}
                  <button onClick={e=>{e.stopPropagation();setEditingBook(book);}}
                    style={{ background:"#f0f9f4",border:`1px solid #a5d6a7`,color:"#1a6b3c",borderRadius:7,padding:"4px 9px",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:3 }}>
                    <i className="ti ti-edit" style={{ fontSize:11 }}/>Edit
                  </button>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:5 }}>
                <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:barC,borderRadius:3 }}/></div>
                <span style={{ fontSize:10,color:"#aaa" }}>{stats.totalSold}/{stats.effective}{stats.returned>0?` (+${stats.returned} returned)`:""}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:book.status!=="complete"?8:0 }}>
                <span style={{ color:GREEN,fontWeight:700 }}>Collected: {fmt(stats.totalCollected)}</span>
                <span style={{ color:stats.pending>0?"#e65100":GREEN,fontWeight:stats.pending===0?700:400 }}>Pending: {fmt(stats.pending)}</span>
              </div>
              {stats.returned>0&&<div style={{ fontSize:10,color:"#e65100",marginBottom:book.status!=="complete"?8:0 }}><i className="ti ti-corner-down-left" style={{ fontSize:11,marginRight:3 }}/>{stats.returned} ticket{stats.returned!==1?"s":""} returned · {book.stopNotes||"Stopped selling"}</div>}
              {book.status!=="complete" ? (
                book.isCommon ? (
                  <button onClick={()=>{setBook(book);setView("common");}} style={{ width:"100%",background:"linear-gradient(135deg,#4a148c,#6a1b9a)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                    <i className="ti ti-ticket"/> Sell common ticket
                  </button>
                ) : (
                  <button onClick={()=>{setBook(book);setView("collect");}} style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                    <i className="ti ti-cash"/> Collect Cash
                  </button>
                )
              ) : (
                /* Wrongly marked complete — show reopen */
                !book.isCommon && !book.stoppedSelling && stats.totalSold < stats.effective && (
                  <button onClick={()=>resetBook(book.id)} style={{ width:"100%",background:"#fff",color:"#e65100",border:"1.5px solid #e65100",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:4 }}>
                    <i className="ti ti-refresh" style={{ fontSize:13 }}/> Reopen — {stats.effective - stats.totalSold} tickets still unsold
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
