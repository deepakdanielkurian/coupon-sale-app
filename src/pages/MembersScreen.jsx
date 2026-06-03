import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getMemberStats, getBookStats, fmt } from "../data/store";
import { generateMemberId } from "../data/store";
import { getSeriesFromBook } from "../data/bookConfig";
import { Badge, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip } from "../components/UI";

const GREEN = "#1a6b3c";
const MODE_ICONS  = { cash:"ti-cash", upi:"ti-device-mobile", bank:"ti-building-bank" };
const MODE_COLORS = { cash:"#1a6b3c", upi:"#1565c0", bank:"#7b4400" };
const MODE_BG     = { cash:"#e8f5ee", upi:"#e3f2fd", bank:"#fff3e0" };

// ── Inline collect cash inside member profile ─────────────────
function InlineCollectCash({ book, collections, onSave, onCancel, onStop }) {
  const bookCols       = collections.filter(c => c.bookId === book.id);
  const totalSold      = bookCols.reduce((s,c) => s+(c.ticketsSold||0), 0);
  const totalCollected = bookCols.reduce((s,c) => s+(c.amount||0), 0);
  const returned       = book.returnedTickets || 0;
  const effective      = book.ticketCount - returned;
  const remaining      = effective - totalSold;

  const [date,    setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [tickets, setTickets] = useState("");
  const [payMode, setPayMode] = useState("cash");
  const [remarks, setRemarks] = useState("");
  const [mode,    setMode]    = useState("collect"); // "collect" | "stop"

  // Stop-selling state
  const [stopReturning, setStopReturning] = useState(String(remaining));
  const [stopNotes,     setStopNotes]     = useState("");

  const t            = parseInt(tickets)||0;
  const amount       = t * 1000;
  const newSold      = totalSold + t;
  const newCollected = totalCollected + amount;
  const afterEffective = effective; // effective doesn't change when collecting
  const afterPending = Math.max(0, afterEffective*1000 - newCollected);
  const pct          = effective > 0 ? Math.round((newSold/effective)*100) : 0;
  const willComplete = newSold >= effective;
  const valid        = t > 0 && t <= remaining;

  const stopRet      = parseInt(stopReturning)||0;
  const stopValid    = stopRet >= 0 && stopRet <= remaining;

  function submitCollect() {
    if (!valid) return;
    onSave({ id:`C-${Date.now()}`, bookId:book.id, memberId:book.memberId, date, ticketsSold:t, amount, paymentMode:payMode, remarks });
  }

  function submitStop() {
    if (!stopValid) return;
    onStop(stopRet, stopNotes);
  }

  return (
    <div style={{ background:"#f0f9f4", borderRadius:10, border:`2px solid ${GREEN}`, padding:"12px 14px", marginTop:8 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:12, fontWeight:700, color:GREEN }}>
          <i className="ti ti-cash" style={{ marginRight:5 }}/>Book {book.bookNumber}
        </div>
        <button onClick={onCancel} style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:18, lineHeight:1, padding:0 }}>✕</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5, marginBottom:10 }}>
        {[["Effective",effective],["Sold",totalSold],["Left",remaining]].map(([l,v])=>(
          <div key={l} style={{ background:"#fff", borderRadius:7, padding:"5px 6px", textAlign:"center" }}>
            <div style={{ fontSize:9, color:"#aaa" }}>{l}</div>
            <div style={{ fontSize:14, fontWeight:700, color:l==="Left"&&v===0?GREEN:l==="Left"?"#e65100":"#1a1a1a" }}>{v}</div>
          </div>
        ))}
      </div>

      {remaining === 0 ? (
        <div style={{ background:"#e8f5ee", borderRadius:8, padding:"10px 12px", textAlign:"center", color:GREEN, fontWeight:700, fontSize:12 }}>
          <i className="ti ti-circle-check" style={{ fontSize:18, display:"block", marginBottom:4 }}/>
          All {effective} tickets sold — book complete!
        </div>
      ) : (
        <>
          {/* Mode toggle */}
          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            <div onClick={()=>setMode("collect")}
              style={{ flex:1, border:`2px solid ${mode==="collect"?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"8px 6px", background:mode==="collect"?"#e8f5ee":"#fff", textAlign:"center", cursor:"pointer" }}>
              <i className="ti ti-cash" style={{ fontSize:16, color:mode==="collect"?GREEN:"#bbb", display:"block", marginBottom:3 }}/>
              <div style={{ fontSize:11, fontWeight:700, color:mode==="collect"?GREEN:"#888" }}>Collect cash</div>
              <div style={{ fontSize:9, color:"#aaa", marginTop:1 }}>Record payment</div>
            </div>
            <div onClick={()=>setMode("stop")}
              style={{ flex:1, border:`2px solid ${mode==="stop"?"#e65100":"#e0e0e0"}`, borderRadius:9, padding:"8px 6px", background:mode==="stop"?"#fff8e1":"#fff", textAlign:"center", cursor:"pointer" }}>
              <i className="ti ti-player-stop" style={{ fontSize:16, color:mode==="stop"?"#e65100":"#bbb", display:"block", marginBottom:3 }}/>
              <div style={{ fontSize:11, fontWeight:700, color:mode==="stop"?"#e65100":"#888" }}>Stop selling</div>
              <div style={{ fontSize:9, color:"#aaa", marginTop:1 }}>Return remaining</div>
            </div>
          </div>

          {/* ── COLLECT CASH MODE ── */}
          {mode==="collect" && (
            <>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Date *</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                  style={{ width:"100%", background:"#fff", border:`1.5px solid ${GREEN}`, borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
              </div>
              <div style={{ marginBottom:8 }}>
                <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Tickets sold (max {remaining}) *</div>
                <input type="number" min="1" max={remaining} value={tickets} onChange={e=>setTickets(e.target.value)}
                  placeholder={`1 – ${remaining}`}
                  style={{ width:"100%", background:"#fff", border:`1.5px solid ${t>remaining?"#dc2626":t>0?GREEN:"#e0e0e0"}`, borderRadius:8, padding:"8px 10px", fontSize:13, fontWeight:700, outline:"none", boxSizing:"border-box" }}/>
                {t>remaining&&<div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>Max {remaining} remaining</div>}
              </div>
              {t>0 && t<=remaining && (
                <>
                  <div style={{ background:"#e8f5ee", borderRadius:8, padding:"9px 11px", marginBottom:8, border:"1px solid #a5d6a7" }}>
                    <div style={{ fontSize:10, color:"#2e7d32", marginBottom:2 }}>Amount (auto-calculated)</div>
                    <div style={{ fontSize:24, fontWeight:700, color:GREEN }}>{fmt(amount)}</div>
                    <div style={{ fontSize:10, color:"#555" }}>{t} × Rs.1,000</div>
                  </div>
                  <div style={{ background:"#fff", borderRadius:8, border:"1px solid #eee", padding:"9px 11px", marginBottom:8 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"#1a1a1a", marginBottom:6 }}>After this entry</div>
                    {[
                      ["Tickets sold",  `${newSold} / ${effective}`],
                      ["Remaining",     `${remaining-t} left`,    remaining-t===0?GREEN:"#e65100"],
                      ["Collected",     fmt(newCollected),         GREEN],
                      ["Balance",       fmt(afterPending),         afterPending<=0?GREEN:"#e65100"],
                      ["Completion",    `${pct}%`],
                    ].map(([l,v,c],i,arr)=>(
                      <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:i<arr.length-1?"0.5px solid #f5f5f5":"none", fontSize:11 }}>
                        <span style={{ color:"#777" }}>{l}</span>
                        <span style={{ fontWeight:700, color:c||"#1a1a1a" }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ height:5, background:"#f0f0f0", borderRadius:3, overflow:"hidden", marginTop:6 }}>
                      <div style={{ width:`${pct}%`, height:"100%", background:pct===100?GREEN:"#4caf50", borderRadius:3 }}/>
                    </div>
                    {willComplete&&<div style={{ marginTop:6, background:"#e8f5ee", borderRadius:6, padding:"5px 8px", fontSize:10, color:GREEN, fontWeight:700 }}><i className="ti ti-trophy" style={{ marginRight:4 }}/>All tickets sold! Book complete 🎉</div>}
                  </div>
                </>
              )}
              <div style={{ display:"flex", gap:5, marginBottom:8 }}>
                {["cash","upi","bank"].map(m=>(
                  <div key={m} onClick={()=>setPayMode(m)}
                    style={{ flex:1, border:`${payMode===m?"2px":"1px"} solid ${payMode===m?GREEN:"#e0e0e0"}`, borderRadius:7, padding:"7px 4px", background:payMode===m?"#e8f5ee":"#fff", textAlign:"center", fontSize:10, color:payMode===m?GREEN:"#888", fontWeight:payMode===m?700:400, cursor:"pointer" }}>
                    <i className={`ti ${MODE_ICONS[m]}`} style={{ fontSize:14, display:"block", marginBottom:2 }}/>{m.toUpperCase()}
                  </div>
                ))}
              </div>
              <input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Remarks (optional)"
                style={{ width:"100%", background:"#fff", border:"1px solid #e0e0e0", borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
              <button onClick={submitCollect} disabled={!valid}
                style={{ width:"100%", background:valid?`linear-gradient(135deg,${GREEN},#2e7d32)`:"#e0e0e0", color:"#fff", border:"none", borderRadius:9, padding:"11px", fontSize:12, fontWeight:700, cursor:valid?"pointer":"not-allowed" }}>
                <i className="ti ti-check" style={{ marginRight:5 }}/>Save collection entry
              </button>
            </>
          )}

          {/* ── STOP SELLING MODE ── */}
          {mode==="stop" && (
            <div style={{ background:"#fff8e1", borderRadius:10, border:"1.5px solid #ffe082", padding:"12px" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:12 }}>
                <i className="ti ti-player-stop" style={{ color:"#e65100", fontSize:18, flexShrink:0, marginTop:1 }}/>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#e65100" }}>Seller is stopping — return tickets</div>
                  <div style={{ fontSize:10, color:"#bf360c", marginTop:3, lineHeight:1.5 }}>
                    The seller has {remaining} unsold tickets. How many are they returning?
                    Returned tickets won't count toward pending balance.
                  </div>
                </div>
              </div>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Tickets being returned *</div>
                <input type="number" min="0" max={remaining} value={stopReturning} onChange={e=>setStopReturning(e.target.value)}
                  style={{ width:"100%", background:"#fff", border:`1.5px solid ${stopValid?"#e65100":"#dc2626"}`, borderRadius:8, padding:"9px 10px", fontSize:16, fontWeight:700, outline:"none", boxSizing:"border-box", color:"#e65100", textAlign:"center" }}/>
                <div style={{ fontSize:10, color:"#888", marginTop:3 }}>Max {remaining} (all remaining unsold tickets)</div>
              </div>
              {/* Summary after stop */}
              {stopValid && (
                <div style={{ background:"#fff", borderRadius:8, padding:"9px 11px", marginBottom:10, border:"1px solid #ffe082" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"#1a1a1a", marginBottom:6 }}>Summary after stopping</div>
                  {[
                    ["Tickets sold by seller",  totalSold],
                    ["Tickets returned",         stopRet,   "#e65100"],
                    ["Effective tickets",         effective - stopRet + (book.returnedTickets||0), "#1a1a1a"],
                    ["Amount already collected", fmt(totalCollected), GREEN],
                    ["Balance now due",          fmt(Math.max(0, (effective-stopRet)*1000 - totalCollected)), (effective-stopRet)*1000-totalCollected<=0?GREEN:"#e65100"],
                  ].map(([l,v,c],i,arr)=>(
                    <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"3px 0", borderBottom:i<arr.length-1?"0.5px solid #f5f5f5":"none", fontSize:11 }}>
                      <span style={{ color:"#777" }}>{l}</span>
                      <span style={{ fontWeight:700, color:c||"#1a1a1a" }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <input value={stopNotes} onChange={e=>setStopNotes(e.target.value)} placeholder="Reason (optional) e.g. travelling, unwell..."
                style={{ width:"100%", background:"#fff", border:"1px solid #e0e0e0", borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:10 }}/>
              <button onClick={submitStop} disabled={!stopValid}
                style={{ width:"100%", background:stopValid?"#e65100":"#ccc", color:"#fff", border:"none", borderRadius:9, padding:"11px", fontSize:12, fontWeight:700, cursor:stopValid?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <i className="ti ti-player-stop" style={{ fontSize:14 }}/>
                Confirm — return {stopRet} ticket{stopRet!==1?"s":""} & close book
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Member form ───────────────────────────────────────────────
function MemberForm({ onSave, onCancel, existing }) {
  const [form, setForm] = useState(existing || { firstName:"", lastName:"", phone:"", whatsapp:"", address:"", label:"committee_member", commission:0, notes:"" });
  const [errors, setErrors] = useState({});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  function submit() {
    const e={};
    if (!form.firstName.trim()) e.firstName="Required";
    if (!form.lastName.trim())  e.lastName="Required";
    if (!form.phone.trim())     e.phone="Required";
    if (Object.keys(e).length){setErrors(e);return;}
    onSave(form);
  }

  const labelDefs=[
    {key:"committee_member",icon:"ti-users",     desc:"Existing committee member selling books"},
    {key:"outside_member",  icon:"ti-user",      desc:"Non-committee person given a book"},
    {key:"commission_agent",icon:"ti-handshake", desc:"Agent earning commission on sales"},
    {key:"common",          icon:"ti-star",      desc:"Common member (general category)"},
  ];

  return (
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 10px 14px" }}>
      <SectionLabel>Personal details</SectionLabel>
      <div style={{ display:"flex", gap:6 }}>
        <div style={{ flex:1 }}><InputField label="First name" required value={form.firstName} onChange={v=>set("firstName",v)} error={errors.firstName}/></div>
        <div style={{ flex:1 }}><InputField label="Last name"  required value={form.lastName}  onChange={v=>set("lastName",v)}  error={errors.lastName}/></div>
      </div>
      <InputField label="Phone" required value={form.phone} onChange={v=>set("phone",v)} placeholder="+91 94470 ..." error={errors.phone}/>
      <InputField label="WhatsApp" value={form.whatsapp} onChange={v=>set("whatsapp",v)} placeholder="Same as phone or different"/>
      <InputField label="Address"  value={form.address}  onChange={v=>set("address",v)}  placeholder="House name, street..."/>
      <SectionLabel>Label / category</SectionLabel>
      <InfoChip>How is this person connected to the coupon sale?</InfoChip>
      {labelDefs.map(({key,icon,desc})=>{
        const cfg=LABELS[key];
        return(
          <div key={key} onClick={()=>set("label",key)}
            style={{ background:"#fff", borderRadius:10, border:`${form.label===key?"1.5px":"1px"} solid ${form.label===key?GREEN:"#eee"}`, padding:"10px 12px", marginBottom:6, display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
            <div style={{ width:32,height:32,borderRadius:8,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",color:cfg.color,fontSize:15,flexShrink:0 }}><i className={`ti ${icon}`}/></div>
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:600,color:"#1a1a1a" }}>{cfg.label}</div><div style={{ fontSize:10,color:"#888",marginTop:1 }}>{desc}</div></div>
            <div style={{ width:18,height:18,borderRadius:"50%",border:`2px solid ${form.label===key?GREEN:"#ccc"}`,background:form.label===key?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {form.label===key&&<div style={{ width:7,height:7,borderRadius:"50%",background:"#fff" }}/>}
            </div>
          </div>
        );
      })}
      {form.label==="commission_agent"&&<InputField label="Commission %" type="number" value={form.commission} onChange={v=>set("commission",v)} placeholder="e.g. 5"/>}
      <InputField label="Notes" value={form.notes} onChange={v=>set("notes",v)} placeholder="Any note..."/>
      <PrimaryButton onClick={submit}><i className="ti ti-check"/> {existing?"Update member":"Save member"}</PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Member detail ─────────────────────────────────────────────
function MemberDetail({ member, onEdit }) {
  const { data, addCollection, stopSelling, resetBook } = useApp();
  const { books, collections } = data;

  // Always use live collections from context
  const stats   = getMemberStats(member.id, books, collections);
  const cfg     = LABELS[member.label]||LABELS.committee_member;
  const memberCols = collections.filter(c=>c.memberId===member.id).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));

  const [tab,            setTab]           = useState("overview");
  const [collectingBook, setCollectingBook]= useState(null);

  const byMode = { cash:0, upi:0, bank:0 };
  memberCols.forEach(c=>{ byMode[c.paymentMode||"cash"]+=(c.amount||0); });

  const weeklyData=(()=>{
    const wks={};
    memberCols.forEach(c=>{
      const d=new Date(c.date||Date.now());
      const wn=`W${Math.ceil(((d-new Date(d.getFullYear(),0,1))/86400000+1)/7)}`;
      wks[wn]=(wks[wn]||0)+(c.amount||0);
    });
    return Object.entries(wks).slice(-6);
  })();
  const maxWk=Math.max(...weeklyData.map(([,v])=>v),1);

  return(
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"10px 10px 14px" }}>

      {/* Profile card */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, paddingBottom:10, borderBottom:"1px solid #f5f5f5" }}>
          <div style={{ width:48,height:48,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:cfg.color,flexShrink:0 }}>
            {(member.firstName[0]+member.lastName[0]).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15,fontWeight:700,color:"#1a1a1a" }}>{member.firstName} {member.lastName}</div>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:3 }}><Badge type={member.label}/><span style={{ fontSize:10,color:"#888" }}>{member.id}</span></div>
          </div>
          <button onClick={onEdit} style={{ background:"#fff",border:`1px solid ${GREEN}`,color:GREEN,borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer" }}>
            <i className="ti ti-edit"/> Edit
          </button>
        </div>
        {[
          member.phone&&    {icon:"ti-phone",          val:member.phone},
          member.whatsapp&& {icon:"ti-brand-whatsapp", val:member.whatsapp},
          member.address&&  {icon:"ti-map-pin",        val:member.address},
          member.commission>0&&{icon:"ti-percentage",  val:`${member.commission}% commission`},
          member.notes&&    {icon:"ti-notes",          val:member.notes},
        ].filter(Boolean).map((r,i)=>(
          <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"3px 0",fontSize:12,color:"#444" }}>
            <i className={`ti ${r.icon}`} style={{ color:"#888",fontSize:13,width:16 }}/>{r.val}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
        {[
          {label:"Books assigned",  value:stats.memberBooks.length,                  color:"#1a1a1a"},
          {label:"Total collected", value:fmt(stats.totalCollected),                  color:GREEN},
          {label:"Tickets sold",    value:`${stats.soldTickets}/${stats.totalTickets}`,color:"#1a1a1a"},
          {label:"Balance due",     value:fmt(stats.totalPending),                    color:stats.totalPending>0?"#e65100":GREEN},
        ].map((s,i)=>(
          <div key={i} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px" }}>
            <div style={{ fontSize:10,color:"#aaa" }}>{s.label}</div>
            <div style={{ fontSize:15,fontWeight:700,color:s.color,marginTop:2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Payment mode breakdown */}
      <div style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>Payment mode breakdown</div>
        <div style={{ display:"flex",gap:6 }}>
          {["cash","upi","bank"].map(mode=>(
            <div key={mode} style={{ flex:1,background:MODE_BG[mode],borderRadius:8,padding:"8px 6px",textAlign:"center" }}>
              <i className={`ti ${MODE_ICONS[mode]}`} style={{ color:MODE_COLORS[mode],fontSize:17 }}/>
              <div style={{ fontSize:9,color:MODE_COLORS[mode],fontWeight:700,marginTop:3 }}>{mode.toUpperCase()}</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginTop:2 }}>{fmt(byMode[mode])}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly trend */}
      {weeklyData.length>0&&(
        <div style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:10 }}>Weekly collection trend</div>
          <div style={{ display:"flex",alignItems:"flex-end",gap:4,height:48 }}>
            {weeklyData.map(([wk,amt])=>(
              <div key={wk} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                <div style={{ fontSize:8,color:"#888" }}>{fmt(amt).replace("Rs.","")}</div>
                <div style={{ width:"100%",background:GREEN,borderRadius:"3px 3px 0 0",height:`${Math.max(5,Math.round((amt/maxWk)*38))}px`,opacity:0.85 }}/>
                <div style={{ fontSize:8,color:"#aaa" }}>{wk}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex",background:"#fff",borderRadius:10,border:"1px solid #eee",padding:4,marginBottom:10,gap:4 }}>
        {[["overview","Books & cash"],["payments","Payment history"]].map(([key,lbl])=>(
          <button key={key} onClick={()=>setTab(key)}
            style={{ flex:1,padding:"7px 4px",borderRadius:7,border:"none",background:tab===key?GREEN:"transparent",color:tab===key?"#fff":"#888",fontSize:11,fontWeight:tab===key?700:400,cursor:"pointer" }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Books tab */}
      {tab==="overview"&&(
        <>
          <SectionLabel>Assigned books</SectionLabel>
          {stats.memberBooks.length===0
            ? <div style={{ fontSize:12,color:"#aaa",textAlign:"center",padding:"20px 0" }}>No books assigned yet</div>
            : stats.memberBooks.map(book=>{
                // Always get live stats using current collections from context
                const bookCols   = collections.filter(c=>c.bookId===book.id);
                const totalSold  = bookCols.reduce((s,c)=>s+(c.ticketsSold||0),0);
                const totalColl  = bookCols.reduce((s,c)=>s+(c.amount||0),0);
                const returned   = book.returnedTickets||0;
                const effective  = book.ticketCount - returned;
                const pending    = Math.max(0, effective*1000 - totalColl);
                const pct        = effective>0?Math.round((totalSold/effective)*100):0;
                const sr         = getSeriesFromBook(book.bookNumber);
                const isOpen     = collectingBook===book.id;
                const isComplete = book.status==="complete";

                return(
                  <div key={book.id} style={{ background:"#fff",borderRadius:10,border:`1px solid ${isOpen?GREEN:"#eee"}`,padding:"10px 12px",marginBottom:8,transition:"border 0.2s" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                      <div style={{ width:32,height:32,borderRadius:8,background:sr?sr.bg:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:sr?sr.color:"#aaa",fontSize:13,flexShrink:0 }}>{book.bookNumber?.charAt(0)}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>Book {book.bookNumber}</div>
                        <div style={{ fontSize:10,color:"#aaa" }}>Tickets {book.ticketFrom}–{book.ticketTo} · Issued {book.issueDate||"—"}</div>
                      </div>
                      <span style={{ fontSize:9,padding:"2px 7px",borderRadius:7,fontWeight:700,background:isComplete?"#e8f5ee":totalSold>0?"#fff3e0":"#ffebee",color:isComplete?GREEN:totalSold>0?"#e65100":"#c62828" }}>
                        {book.stoppedSelling?"Stopped":isComplete?"Complete":totalSold>0?"Ongoing":"Not started"}
                      </span>
                    </div>
                    <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:5 }}>
                      <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}>
                        <div style={{ width:`${pct}%`,height:"100%",background:isComplete?GREEN:"#4caf50",borderRadius:3,transition:"width 0.4s" }}/>
                      </div>
                      <span style={{ fontSize:10,color:"#aaa" }}>{totalSold}/{effective}{returned>0?` (+${returned} ret)`:""}</span>
                    </div>
                    <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:isComplete&&returned===0?0:4 }}>
                      <span style={{ color:GREEN,fontWeight:700 }}>Collected: {fmt(totalColl)}</span>
                      <span style={{ color:pending>0?"#e65100":GREEN,fontWeight:pending===0?700:400 }}>Pending: {fmt(pending)}</span>
                    </div>
                    {returned>0&&<div style={{ fontSize:10,color:"#e65100",marginBottom:isComplete?0:8 }}><i className="ti ti-corner-down-left" style={{ fontSize:11,marginRight:3 }}/>{returned} ticket{returned!==1?"s":""} returned — {book.stopNotes||"stopped selling"}</div>}

                    {/* Collect Cash or Reopen */}
                    {!isComplete ? (
                      isOpen ? (
                        <InlineCollectCash
                          key={`${book.id}-${collections.length}`}
                          book={book}
                          collections={collections}
                          onSave={col=>{ addCollection(col); setCollectingBook(null); }}
                          onStop={(returned, notes)=>{ stopSelling(book.id, returned, notes); setCollectingBook(null); }}
                          onCancel={()=>setCollectingBook(null)}
                        />
                      ) : (
                        <button onClick={()=>setCollectingBook(book.id)}
                          style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                          <i className="ti ti-cash" style={{ fontSize:14 }}/> Collect Cash
                        </button>
                      )
                    ) : (
                      /* Book is marked complete — show reopen if tickets still unsold */
                      !book.stoppedSelling && totalSold < effective && (
                        <button onClick={()=>resetBook(book.id)}
                          style={{ width:"100%",background:"#fff",color:"#e65100",border:"1.5px solid #e65100",borderRadius:8,padding:"8px",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5,marginTop:4 }}>
                          <i className="ti ti-refresh" style={{ fontSize:13 }}/> Reopen book — still {effective - totalSold} tickets unsold
                        </button>
                      )
                    )}
                  </div>
                );
              })
          }
        </>
      )}

      {/* Payment history tab */}
      {tab==="payments"&&(
        <>
          <SectionLabel>Cash collection history</SectionLabel>
          {memberCols.length===0
            ? <div style={{ fontSize:12,color:"#aaa",textAlign:"center",padding:"20px 0" }}>No collections recorded yet</div>
            : memberCols.map(col=>{
                const book=books.find(b=>b.id===col.bookId);
                const mode=col.paymentMode||"cash";
                return(
                  <div key={col.id} style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:6 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <div style={{ width:32,height:32,borderRadius:8,background:MODE_BG[mode],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                        <i className={`ti ${MODE_ICONS[mode]}`} style={{ color:MODE_COLORS[mode],fontSize:16 }}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{fmt(col.amount)}</div>
                        <div style={{ fontSize:10,color:"#888",marginTop:1 }}>{col.date} · Book {book?.bookNumber||"—"} · {col.ticketsSold} tickets</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:7,background:MODE_BG[mode],color:MODE_COLORS[mode] }}>{mode.toUpperCase()}</span>
                        {col.remarks&&<div style={{ fontSize:9,color:"#aaa",marginTop:3,maxWidth:80,textAlign:"right" }}>{col.remarks}</div>}
                      </div>
                    </div>
                  </div>
                );
              })
          }
          <SectionLabel>Total by mode</SectionLabel>
          <div style={{ display:"flex",gap:6 }}>
            {["cash","upi","bank"].map(mode=>(
              <div key={mode} style={{ flex:1,background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 6px",textAlign:"center" }}>
                <div style={{ fontSize:9,color:"#888" }}>{mode.toUpperCase()}</div>
                <div style={{ fontSize:13,fontWeight:700,color:MODE_COLORS[mode],marginTop:3 }}>{fmt(byMode[mode])}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Members Screen ───────────────────────────────────────
export default function MembersScreen() {
  const { data, addMember, updateMember } = useApp();
  const [view,        setView]    = useState("list");
  const [selected,    setSelected]= useState(null);
  const [search,      setSearch]  = useState("");
  const [filterLabel, setFL]      = useState("all");

  const filtered = data.members.filter(m=>{
    const lm = filterLabel==="all"||m.label===filterLabel;
    const sm = `${m.firstName} ${m.lastName} ${m.phone} ${m.id}`.toLowerCase().includes(search.toLowerCase());
    return lm&&sm;
  });

  function handleSave(form){
    if (view==="edit"&&selected){
      updateMember(selected.id,form);
      setSelected({...selected,...form});
      setView("detail");
    } else {
      const id=generateMemberId(data.members);
      addMember({...form,id,createdAt:new Date().toISOString().split("T")[0]});
      setView("list");
    }
  }

  const Header=({title,sub,onBack})=>(
    <div style={{ background:GREEN,padding:"10px 14px 12px",display:"flex",alignItems:"center",gap:10 }}>
      {onBack&&<button onClick={onBack} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0 }}><i className="ti ti-arrow-left"/></button>}
      <div>
        <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>{title}</div>
        {sub&&<div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );

  if (view==="add") return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <Header title="Add new member" sub="Fill all details" onBack={()=>setView("list")}/>
      <MemberForm onSave={handleSave} onCancel={()=>setView("list")}/>
    </div>
  );
  if (view==="edit"&&selected) return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <Header title="Edit member" onBack={()=>setView("detail")}/>
      <MemberForm onSave={handleSave} onCancel={()=>setView("detail")} existing={data.members.find(m=>m.id===selected.id)}/>
    </div>
  );
  if (view==="detail"&&selected){
    const live=data.members.find(m=>m.id===selected.id)||selected;
    return(
      <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
        <Header title={`${live.firstName} ${live.lastName}`} sub="Member profile" onBack={()=>setView("list")}/>
        <MemberDetail member={live} onEdit={()=>setView("edit")}/>
      </div>
    );
  }

  return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <div style={{ background:GREEN,padding:"10px 14px 12px" }}>
        <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Members</div>
        <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>{data.members.length} registered</div>
      </div>
      <div style={{ background:"#f5f7f5",flex:1,overflowY:"auto",padding:"10px 10px 4px" }}>

        {/* Search + Add */}
        <div style={{ display:"flex",gap:6,marginBottom:8 }}>
          <div style={{ flex:1,background:"#fff",borderRadius:9,border:"1px solid #eee",display:"flex",alignItems:"center",padding:"0 10px",gap:6 }}>
            <i className="ti ti-search" style={{ color:"#ccc",fontSize:15 }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, ID..."
              style={{ flex:1,border:"none",outline:"none",fontSize:12,color:"#1a1a1a",background:"transparent",padding:"9px 0" }}/>
            {search&&<button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",color:"#aaa" }}><i className="ti ti-x" style={{ fontSize:13 }}/></button>}
          </div>
          <button onClick={()=>setView("add")}
            style={{ background:GREEN,color:"#fff",border:"none",borderRadius:9,padding:"8px 13px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
            <i className="ti ti-plus"/> Add
          </button>
        </div>

        {/* Label filter */}
        <div style={{ display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" }}>
          {[["all","All"],["committee_member","Committee"],["outside_member","Outside"],["commission_agent","Agent"],["common","Common"]].map(([v,l])=>(
            <div key={v} onClick={()=>setFL(v)}
              style={{ background:filterLabel===v?GREEN:"#fff",color:filterLabel===v?"#fff":"#666",border:`1px solid ${filterLabel===v?GREEN:"#e0e0e0"}`,borderRadius:14,padding:"4px 10px",fontSize:10,fontWeight:filterLabel===v?700:400,cursor:"pointer" }}>
              {l} {v!=="all"&&`(${data.members.filter(m=>m.label===v).length})`}
            </div>
          ))}
        </div>

        {filtered.length===0&&<div style={{ textAlign:"center",color:"#aaa",fontSize:12,padding:"30px 0" }}>No members found</div>}

        {filtered.map(m=>{
          const stats=getMemberStats(m.id,data.books,data.collections);
          const cfg=LABELS[m.label]||LABELS.committee_member;
          return(
            <div key={m.id} onClick={()=>{setSelected(m);setView("detail");}}
              style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:38,height:38,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:cfg.color,flexShrink:0 }}>
                {(m.firstName[0]+m.lastName[0]).toUpperCase()}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div>
                <div style={{ display:"flex",alignItems:"center",gap:5,marginTop:2 }}><Badge type={m.label}/><span style={{ fontSize:10,color:"#888" }}>{m.phone}</span></div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(stats.totalCollected)}</div>
                <div style={{ fontSize:10,color:stats.totalPending>0?"#e65100":"#888" }}>{stats.memberBooks.length} books</div>
              </div>
              <i className="ti ti-chevron-right" style={{ color:"#ddd",fontSize:14,marginLeft:4 }}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}
