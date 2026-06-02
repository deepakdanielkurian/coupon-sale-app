import { useState, useMemo } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getBookStats, fmt } from "../data/store";
import { BOOK_SERIES, ALL_BOOKS, TICKET_PRICE, TOTAL_TICKETS, getSeriesFromBook, getSeriesSummary } from "../data/bookConfig";
import { Badge, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip, StatusBadge } from "../components/UI";

const GREEN = "#1a6b3c";

// ── Common ticket sell form ───────────────────────────────────
function SellCommonTicketForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats = getBookStats(book, data.collections);

  // Each entry = one ticket with buyer name
  const [date, setDate]       = useState(new Date().toISOString().split("T")[0]);
  const [payMode, setPayMode] = useState("cash");
  const [entries, setEntries] = useState([{ ticketNo: "", buyerName: "", amount: 1000 }]);
  const [errors, setErrors]   = useState([]);

  const remaining = book.ticketCount - stats.totalSold;

  function addEntry() {
    setEntries(prev => [...prev, { ticketNo: "", buyerName: "", amount: 1000 }]);
  }
  function removeEntry(i) {
    setEntries(prev => prev.filter((_, idx) => idx !== i));
  }
  function updateEntry(i, key, val) {
    setEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  }

  function validate() {
    const e = entries.map((en, i) => {
      const err = {};
      if (!en.ticketNo.toString().trim()) err.ticketNo = "Required";
      if (!en.buyerName.trim()) err.buyerName = "Buyer name required";
      const tno = parseInt(en.ticketNo);
      if (tno < book.ticketFrom || tno > book.ticketTo) err.ticketNo = `Must be ${book.ticketFrom}–${book.ticketTo}`;
      // Check duplicate within this batch
      const dupInBatch = entries.findIndex((x, j) => j !== i && x.ticketNo.toString() === en.ticketNo.toString()) !== -1;
      if (dupInBatch) err.ticketNo = "Duplicate ticket in this entry";
      return err;
    });
    setErrors(e);
    return e.every(er => Object.keys(er).length === 0);
  }

  function submit() {
    if (!validate()) return;
    if (entries.length > remaining) return;
    // Save as one collection entry with ticketEntries array
    onSave({
      id: `C-${Date.now()}`,
      bookId: book.id,
      memberId: null, // common book - no member
      isCommon: true,
      date,
      ticketsSold: entries.length,
      amount: entries.length * 1000,
      paymentMode: payMode,
      ticketEntries: entries.map(e => ({
        ticketNo: parseInt(e.ticketNo),
        buyerName: e.buyerName.trim(),
        amount: 1000,
      })),
      remarks: `Common book - ${entries.length} ticket(s) sold`,
    });
  }

  const totalAmt = entries.length * 1000;

  return (
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 12px 20px" }}>

      {/* Book info */}
      <div style={{ background:"#f3e5f5", borderRadius:12, padding:"10px 12px", marginBottom:10, border:"1px solid #ce93d830" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#4a148c" }}>Common Book {book.bookNumber}</div>
            <div style={{ fontSize:10, color:"#7b1fa2", marginTop:2 }}>Tickets {book.ticketFrom}–{book.ticketTo} · {remaining} remaining</div>
          </div>
          <div style={{ background:"#4a148c", color:"#fff", fontSize:9, fontWeight:700, padding:"3px 8px", borderRadius:7 }}>COMMON</div>
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11 }}>
          <span style={{ color:"#1a6b3c", fontWeight:700 }}>Sold: {stats.totalSold}/{book.ticketCount}</span>
          <span style={{ color:"#e65100" }}>Pending: {remaining} tickets</span>
        </div>
      </div>

      <InfoChip>Enter each ticket number and buyer name. Each ticket = Rs.1,000.</InfoChip>

      {/* Date */}
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:5 }}>Sale date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"10px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
      </div>

      {/* Ticket entries */}
      <div style={{ fontSize:11, fontWeight:700, color:"#4a148c", textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:8 }}>
        Ticket entries ({entries.length})
      </div>

      {entries.map((entry, i) => (
        <div key={i} style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"10px 12px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#4a148c" }}>Ticket {i+1}</div>
            {entries.length > 1 && (
              <button onClick={()=>removeEntry(i)}
                style={{ background:"#ffebee", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:6, padding:"3px 8px", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                Remove
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Ticket number *</div>
              <input type="number" value={entry.ticketNo} onChange={e=>updateEntry(i,"ticketNo",e.target.value)}
                placeholder={`${book.ticketFrom}–${book.ticketTo}`}
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${errors[i]?.ticketNo?"#dc2626":entry.ticketNo?GREEN:"#e0e0e0"}`, borderRadius:8, padding:"8px 10px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              {errors[i]?.ticketNo && <div style={{ fontSize:10, color:"#dc2626", marginTop:2 }}>{errors[i].ticketNo}</div>}
            </div>
            <div style={{ flex:2 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Buyer name *</div>
              <input type="text" value={entry.buyerName} onChange={e=>updateEntry(i,"buyerName",e.target.value)}
                placeholder="e.g. Thankachan P."
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${errors[i]?.buyerName?"#dc2626":entry.buyerName?GREEN:"#e0e0e0"}`, borderRadius:8, padding:"8px 10px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              {errors[i]?.buyerName && <div style={{ fontSize:10, color:"#dc2626", marginTop:2 }}>{errors[i].buyerName}</div>}
            </div>
          </div>
          <div style={{ marginTop:6, fontSize:11, color:"#1a6b3c", fontWeight:600, textAlign:"right" }}>Rs.1,000</div>
        </div>
      ))}

      {entries.length < remaining && (
        <button onClick={addEntry}
          style={{ width:"100%", background:"#fff", color:"#4a148c", border:"1.5px dashed #ce93d8", borderRadius:10, padding:"10px", fontSize:12, fontWeight:700, cursor:"pointer", marginBottom:10 }}>
          + Add another ticket
        </button>
      )}

      {/* Total */}
      <div style={{ background:"#4a148c", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)" }}>{entries.length} ticket{entries.length>1?"s":""} · Common book</div>
          <div style={{ fontSize:20, fontWeight:700, color:"#fff" }}>{fmt(totalAmt)}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>each ticket</div>
          <div style={{ fontSize:14, fontWeight:700, color:"#ce93d8" }}>Rs.1,000</div>
        </div>
      </div>

      {/* Payment mode */}
      <div style={{ fontSize:11, fontWeight:700, color:"#555", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.4px" }}>Payment mode</div>
      <div style={{ display:"flex", gap:6, marginBottom:12 }}>
        {["cash","upi","bank"].map(m=>(
          <div key={m} onClick={()=>setPayMode(m)}
            style={{ flex:1, border:`${payMode===m?"2px":"1px"} solid ${payMode===m?"#4a148c":"#e0e0e0"}`, borderRadius:9, padding:"9px 4px", background:payMode===m?"#f3e5f5":"#fff", textAlign:"center", fontSize:12, color:payMode===m?"#4a148c":"#888", fontWeight:payMode===m?700:400, cursor:"pointer" }}>
            <i className={`ti ${m==="cash"?"ti-cash":m==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:15, display:"block", marginBottom:3 }}/>
            {m.toUpperCase()}
          </div>
        ))}
      </div>

      <PrimaryButton onClick={submit} disabled={entries.length===0||entries.length>remaining}>
        <i className="ti ti-ticket"/> Save {entries.length} common ticket{entries.length>1?"s":""}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Regular Collect Cash Form ─────────────────────────────────
function CollectCashForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats  = getBookStats(book, data.collections);
  const member = data.members.find(m => m.id === book.memberId);
  const series = getSeriesFromBook(book.bookNumber);

  const [date,        setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setSold]    = useState("");
  const [payMode,     setPayMode] = useState("cash");
  const [remarks,     setRemarks] = useState("");
  const [markDone,    setMarkDone]= useState(false);

  const tickets      = parseInt(ticketsSold)||0;
  const amount       = tickets * TICKET_PRICE;
  const remaining    = book.ticketCount - stats.totalSold;
  const newSold      = stats.totalSold + tickets;
  const newTotal     = stats.totalCollected + amount;
  const newPending   = book.ticketCount * TICKET_PRICE - newTotal;
  const pct          = Math.round((newSold/book.ticketCount)*100);
  const willComplete = newSold >= book.ticketCount;

  function submit() {
    if (!tickets||tickets<=0||tickets>remaining) return;
    onSave({ id:`C-${Date.now()}`, bookId:book.id, memberId:book.memberId, date, ticketsSold:tickets, amount, paymentMode:payMode, remarks, bookCompleted:willComplete||markDone });
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
          {[["Total",book.ticketCount],["Sold",stats.totalSold],["Left",remaining]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.7)",borderRadius:7,padding:"6px 8px",textAlign:"center" }}>
              <div style={{ fontSize:9,color:"#888" }}>{l}</div>
              <div style={{ fontSize:16,fontWeight:700,color:"#1a1a1a" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex",justifyContent:"space-between",marginTop:8,fontSize:11 }}>
          <span style={{ color:GREEN,fontWeight:700 }}>Collected: {fmt(stats.totalCollected)}</span>
          <span style={{ color:"#e65100" }}>Pending: {fmt(stats.pending)}</span>
        </div>
      </div>

      <InfoChip>Amount = tickets × Rs.1,000. Max {remaining} remaining.</InfoChip>

      <SectionLabel>Collection entry</SectionLabel>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:5 }}>Date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ width:"100%",background:"#fff",border:`1.5px solid ${GREEN}`,borderRadius:9,padding:"10px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
      </div>
      <InputField label={`Tickets sold (max ${remaining})`} type="number" value={ticketsSold} onChange={setSold} required
        error={tickets>remaining?`Cannot exceed ${remaining}`:""}/>

      <div style={{ background:"#e8f5ee",borderRadius:10,padding:"12px 14px",marginBottom:10,border:"1px solid #a5d6a7" }}>
        <div style={{ fontSize:11,color:"#555",marginBottom:3 }}>Amount (auto-calculated)</div>
        <div style={{ fontSize:30,fontWeight:700,color:GREEN }}>{fmt(amount)}</div>
        <div style={{ fontSize:11,color:"#888" }}>{tickets} × Rs.1,000</div>
      </div>

      {tickets>0&&tickets<=remaining&&(
        <div style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>After this entry</div>
          {[["Tickets sold",`${newSold}/${book.ticketCount}`],["Remaining",`${book.ticketCount-newSold} left`,book.ticketCount-newSold===0?GREEN:"#e65100"],["Collected",fmt(newTotal),GREEN],["Balance",fmt(Math.max(0,newPending)),newPending<=0?GREEN:"#e65100"],["Completion",`${pct}%`]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<arr.length-1?"1px solid #f5f5f5":"none",fontSize:11 }}>
              <span style={{ color:"#777" }}>{l}</span><span style={{ fontWeight:700,color:c||"#1a1a1a" }}>{v}</span>
            </div>
          ))}
          {willComplete&&<div style={{ marginTop:8,background:"#e8f5ee",borderRadius:8,padding:"7px 10px",display:"flex",gap:6 }}><i className="ti ti-trophy" style={{ color:GREEN,fontSize:15 }}/><span style={{ fontSize:11,color:GREEN,fontWeight:700 }}>Completes Book {book.bookNumber}! 🎉</span></div>}
        </div>
      )}

      {!willComplete&&remaining>0&&(
        <div onClick={()=>setMarkDone(b=>!b)} style={{ display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"10px 12px",marginBottom:10,cursor:"pointer" }}>
          <div style={{ width:18,height:18,borderRadius:5,border:`2px solid ${markDone?GREEN:"#ccc"}`,background:markDone?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center" }}>
            {markDone&&<i className="ti ti-check" style={{ color:"#fff",fontSize:11 }}/>}
          </div>
          <div><div style={{ fontSize:12,fontWeight:600,color:"#1a1a1a" }}>Mark book as complete</div><div style={{ fontSize:10,color:"#aaa" }}>Tick if remaining tickets returned</div></div>
        </div>
      )}

      <SectionLabel>Payment mode</SectionLabel>
      <div style={{ display:"flex",gap:6,marginBottom:10 }}>
        {["cash","upi","bank"].map(m=>(
          <div key={m} onClick={()=>setPayMode(m)}
            style={{ flex:1,border:`${payMode===m?"2px":"1px"} solid ${payMode===m?GREEN:"#e0e0e0"}`,borderRadius:9,padding:"10px 4px",background:payMode===m?"#e8f5ee":"#fff",textAlign:"center",fontSize:12,color:payMode===m?GREEN:"#888",fontWeight:payMode===m?700:400,cursor:"pointer" }}>
            <i className={`ti ${m==="cash"?"ti-cash":m==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:16,display:"block",marginBottom:3 }}/>
            {m.toUpperCase()}
          </div>
        ))}
      </div>
      <InputField label="Remarks (optional)" value={remarks} onChange={setRemarks} placeholder="e.g. 2 tickets returned..."/>
      <PrimaryButton onClick={submit} disabled={!tickets||tickets<=0||tickets>remaining}>
        <i className="ti ti-cash"/> Collect Cash
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Assign Book Form ──────────────────────────────────────────
function AssignBookForm({ onSave, onCancel }) {
  const { data } = useApp();
  const [memberId,   setMemberId]  = useState("");
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
      onSave({ bookNumber:num, series, memberId:isCommon?null:memberId, isCommon, ticketCount:seriesInfo.ticketsPerBook, ticketFrom:bd.ticketFrom, ticketTo:bd.ticketTo, issueDate, status:"not_started", notes });
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
          <div style={{ marginLeft:"auto",fontSize:12,fontWeight:700,color:GREEN }}>{fmt(seriesInfo?.ticketsPerBook*1000)}</div>
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
          <select value={memberId} onChange={e=>{setMemberId(e.target.value);setErrors(v=>({...v,member:""}));}}
            style={{ width:"100%",background:"#f8faf8",border:`1.5px solid ${errors.member?"#dc2626":memberId?GREEN:"#e0e0e0"}`,borderRadius:9,padding:"10px 11px",fontSize:13,color:"#1a1a1a",outline:"none",boxSizing:"border-box" }}>
            <option value="">— choose member —</option>
            {data.members.map(m=><option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {LABELS[m.label]?.label||m.label}</option>)}
          </select>
          {errors.member&&<div style={{ fontSize:10,color:"#dc2626",marginTop:3 }}>{errors.member}</div>}
          {member&&(
            <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:8,background:"#f8faf8",borderRadius:9,padding:"8px 10px" }}>
              <div style={{ width:32,height:32,borderRadius:9,background:LABELS[member.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:LABELS[member.label]?.color,flexShrink:0 }}>{(member.firstName[0]+member.lastName[0]).toUpperCase()}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{member.firstName} {member.lastName}</div><span style={{ fontSize:9,fontWeight:600,padding:"2px 6px",borderRadius:5,background:LABELS[member.label]?.bg,color:LABELS[member.label]?.color }}>{LABELS[member.label]?.label}</span></div>
              <div style={{ fontSize:11,fontWeight:700,color:"#2C2C2A" }}>{memberDBBks.length} book{memberDBBks.length!==1?"s":""}</div>
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
        {seriesInfo&&<div style={{ marginTop:8,background:seriesInfo.bg,borderRadius:8,padding:"7px 10px" }}><div style={{ fontSize:10,fontWeight:600,color:seriesInfo.color }}>{seriesInfo.name} · Tickets {seriesInfo.ticketStart}–{seriesInfo.ticketEnd} · {available.length} available</div></div>}
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
                  <div style={{ fontSize:11,fontWeight:700,color:GREEN }}>{fmt(seriesInfo.ticketsPerBook*1000)}</div>
                  <button onClick={()=>removeBook(num)} style={{ background:"#ffebee",border:"1px solid #fca5a5",color:"#dc2626",borderRadius:6,padding:"3px 7px",fontSize:10,cursor:"pointer" }}>✕</button>
                </div>
              );})}
              <div style={{ background:"#1a1a1a",borderRadius:8,padding:"8px 12px",marginTop:4,display:"flex",justifyContent:"space-between" }}>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.6)" }}>{assigned.length} book{assigned.length>1?"s":""} · {assigned.length*seriesInfo.ticketsPerBook} tickets</div>
                <div style={{ fontSize:13,fontWeight:700,color:"#fff" }}>{fmt(assigned.length*seriesInfo.ticketsPerBook*1000)}</div>
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
  const { data, addBook, addCollection } = useApp();
  const [view,   setView]  = useState("list");
  const [selBook,setBook]  = useState(null);
  const [fSeries,setFS]    = useState("all");
  const [fStatus,setFSt]   = useState("all");
  const [fType,  setFType] = useState("all"); // all | common | member
  const [search, setSearch]= useState("");

  const filtered = useMemo(()=>data.books.filter(b=>{
    const sm = fSeries==="all"||b.series===fSeries||b.bookNumber?.startsWith(fSeries);
    const st = fStatus==="all"||b.status===fStatus;
    const tp = fType==="all"||(fType==="common"&&b.isCommon)||(fType==="member"&&!b.isCommon);
    const member = data.members.find(m=>m.id===b.memberId);
    const memberName = member?`${member.firstName} ${member.lastName}`.toLowerCase():"";
    const sq = !search||(b.bookNumber?.toLowerCase().includes(search.toLowerCase())||memberName.includes(search.toLowerCase()));
    return sm&&st&&tp&&sq;
  }),[data.books,data.members,data.collections,fSeries,fStatus,fType,search]);

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
      <CollectCashForm book={selBook} onSave={col=>{addCollection(col);setView("list");}} onCancel={()=>setView("list")}/>
    </div>
  );
  if (view==="common"&&selBook) return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <Header title="Sell common tickets" sub={`Book ${selBook.bookNumber} · Buyer names required`} onBack={()=>setView("list")}/>
      <SellCommonTicketForm book={selBook} onSave={col=>{addCollection(col);setView("list");}} onCancel={()=>setView("list")}/>
    </div>
  );

  return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <div style={{ background:GREEN,padding:"10px 14px 12px" }}>
        <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Coupon books</div>
        <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>500 books · 10,000 tickets · Rs.1,000 each</div>
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
                <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{s.name} · {s.ticketsPerBook}t/book</div><div style={{ fontSize:10,color:"#aaa" }}>{s.totalBooks} books · Tickets {s.ticketStart}–{s.ticketEnd}</div></div>
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
        {filtered.length===0&&<div style={{ textAlign:"center",color:"#aaa",fontSize:12,padding:"24px 0" }}>No books found</div>}

        {filtered.map(book=>{
          const stats  = getBookStats(book,data.collections);
          const member = data.members.find(m=>m.id===book.memberId);
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
                  </div>
                  <div style={{ fontSize:10,color:"#aaa",marginTop:1 }}>
                    Book {book.bookNumber} · Tickets {book.ticketFrom}–{book.ticketTo}
                    {book.isCommon&&<span style={{ marginLeft:5,background:"#4a148c",color:"#fff",fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:4 }}>COMMON</span>}
                  </div>
                </div>
                <StatusBadge status={book.status}/>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:5 }}>
                <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:barC,borderRadius:3 }}/></div>
                <span style={{ fontSize:10,color:"#aaa" }}>{stats.totalSold}/{book.ticketCount}</span>
              </div>
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:book.status!=="complete"?8:0 }}>
                <span style={{ color:GREEN,fontWeight:700 }}>Collected: {fmt(stats.totalCollected)}</span>
                <span style={{ color:stats.pending>0?"#e65100":"#aaa" }}>Pending: {fmt(stats.pending)}</span>
              </div>
              {book.status!=="complete"&&(
                book.isCommon?(
                  <button onClick={()=>{setBook(book);setView("common");}} style={{ width:"100%",background:"linear-gradient(135deg,#4a148c,#6a1b9a)",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                    <i className="ti ti-ticket"/> Sell common ticket
                  </button>
                ):(
                  <button onClick={()=>{setBook(book);setView("collect");}} style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                    <i className="ti ti-cash"/> Collect Cash
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
