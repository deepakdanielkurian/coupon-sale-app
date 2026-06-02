import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getMemberStats, getBookStats, fmt } from "../data/store";
import { generateMemberId } from "../data/store";
import { getSeriesFromBook } from "../data/bookConfig";
import { Card, Badge, Avatar, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip } from "../components/UI";

const GREEN = "#1a6b3c";
const MODE_ICONS  = { cash:"ti-cash", upi:"ti-device-mobile", bank:"ti-building-bank" };
const MODE_COLORS = { cash:"#1a6b3c", upi:"#1565c0", bank:"#854F0B" };
const MODE_BG     = { cash:"#e8f5ee", upi:"#e3f2fd", bank:"#fff3e0" };

// ── Inline collect cash (used inside member profile) ──────────
function InlineCollectCash({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats     = getBookStats(book, data.collections);
  const remaining = book.ticketCount - stats.totalSold;
  const [date,        setDate]    = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setSold]    = useState("");
  const [payMode,     setPayMode] = useState("cash");
  const [remarks,     setRemarks] = useState("");
  const [markDone,    setMarkDone]= useState(false);

  const tickets      = parseInt(ticketsSold)||0;
  const amount       = tickets * 1000;
  const newSold      = stats.totalSold + tickets;
  const willComplete = newSold >= book.ticketCount;

  function submit() {
    if (!tickets||tickets<=0||tickets>remaining) return;
    onSave({ id:`C-${Date.now()}`, bookId:book.id, memberId:book.memberId, date, ticketsSold:tickets, amount, paymentMode:payMode, remarks, bookCompleted:willComplete||markDone });
  }

  return (
    <div style={{ background:"#f8faf8", borderRadius:10, border:`1.5px solid ${GREEN}`, padding:"12px 14px", marginTop:8 }}>
      <div style={{ fontSize:11, fontWeight:700, color:GREEN, marginBottom:10, display:"flex", justifyContent:"space-between" }}>
        <span><i className="ti ti-cash" style={{ marginRight:5 }}/>Collect Cash — Book {book.bookNumber}</span>
        <button onClick={onCancel} style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:16, padding:0 }}>✕</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
        <div style={{ background:"#fff", borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:"#aaa" }}>Sold</div>
          <div style={{ fontSize:15, fontWeight:700 }}>{stats.totalSold}/{book.ticketCount}</div>
        </div>
        <div style={{ background:"#fff", borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
          <div style={{ fontSize:9, color:"#aaa" }}>Left</div>
          <div style={{ fontSize:15, fontWeight:700, color:remaining>0?"#e65100":"#1a6b3c" }}>{remaining}</div>
        </div>
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${GREEN}`, borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
      </div>
      <div style={{ marginBottom:8 }}>
        <div style={{ fontSize:10, fontWeight:600, color:"#555", marginBottom:4 }}>Tickets sold (max {remaining}) *</div>
        <input type="number" value={ticketsSold} onChange={e=>setSold(e.target.value)} placeholder={`1–${remaining}`}
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${ticketsSold?GREEN:"#e0e0e0"}`, borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
      </div>
      {tickets>0&&(
        <div style={{ background:"#e8f5ee", borderRadius:8, padding:"8px 10px", marginBottom:8, display:"flex", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, color:"#555" }}>Amount (auto)</span>
          <span style={{ fontSize:14, fontWeight:700, color:GREEN }}>{fmt(amount)}</span>
        </div>
      )}
      <div style={{ display:"flex", gap:5, marginBottom:8 }}>
        {["cash","upi","bank"].map(m=>(
          <div key={m} onClick={()=>setPayMode(m)}
            style={{ flex:1, border:`${payMode===m?"2px":"1px"} solid ${payMode===m?GREEN:"#e0e0e0"}`, borderRadius:7, padding:"7px 4px", background:payMode===m?"#e8f5ee":"#fff", textAlign:"center", fontSize:10, color:payMode===m?GREEN:"#888", fontWeight:payMode===m?700:400, cursor:"pointer" }}>
            <i className={`ti ${MODE_ICONS[m]}`} style={{ fontSize:14, display:"block", marginBottom:2 }}/>
            {m.toUpperCase()}
          </div>
        ))}
      </div>
      <input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Remarks (optional)"
        style={{ width:"100%", background:"#fff", border:"1px solid #e0e0e0", borderRadius:8, padding:"8px 10px", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:8 }}/>
      {willComplete&&tickets>0&&(
        <div style={{ background:"#e8f5ee", borderRadius:7, padding:"6px 9px", marginBottom:8, fontSize:11, color:GREEN, fontWeight:600 }}>
          <i className="ti ti-trophy" style={{ marginRight:5 }}/>This completes Book {book.bookNumber}! 🎉
        </div>
      )}
      <button onClick={submit} disabled={!tickets||tickets<=0||tickets>remaining}
        style={{ width:"100%", background:!tickets||tickets>remaining?"#e0e0e0":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:9, padding:"10px", fontSize:12, fontWeight:700, cursor:!tickets||tickets>remaining?"not-allowed":"pointer" }}>
        Save collection entry
      </button>
    </div>
  );
}

// ── Member form ───────────────────────────────────────────────
function MemberForm({ onSave, onCancel, existing }) {
  const { data } = useApp();
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
      <InputField label="Phone number"    required value={form.phone}    onChange={v=>set("phone",v)}    placeholder="+91 94470 ..." error={errors.phone}/>
      <InputField label="WhatsApp number"          value={form.whatsapp} onChange={v=>set("whatsapp",v)} placeholder="Same as phone or different"/>
      <InputField label="House / address"          value={form.address}  onChange={v=>set("address",v)}  placeholder="House name, street..."/>
      <SectionLabel>Label / category</SectionLabel>
      <InfoChip>This label identifies how this person is connected to the coupon sale.</InfoChip>
      {labelDefs.map(({key,icon,desc})=>{
        const cfg=LABELS[key];
        return(
          <div key={key} onClick={()=>set("label",key)} style={{ background:"#fff",borderRadius:10,border:`${form.label===key?"1.5px":"0.5px"} solid ${form.label===key?GREEN:"rgba(0,0,0,0.08)"}`,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10,cursor:"pointer" }}>
            <div style={{ width:32,height:32,borderRadius:8,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",color:cfg.color,fontSize:15,flexShrink:0 }}><i className={`ti ${icon}`}/></div>
            <div style={{ flex:1 }}><div style={{ fontSize:13,fontWeight:500,color:"#1a1a1a" }}>{cfg.label}</div><div style={{ fontSize:10,color:"#888",marginTop:1 }}>{desc}</div></div>
            <div style={{ width:18,height:18,borderRadius:"50%",border:`1.5px solid ${form.label===key?GREEN:"#ccc"}`,background:form.label===key?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              {form.label===key&&<div style={{ width:7,height:7,borderRadius:"50%",background:"#fff" }}/>}
            </div>
          </div>
        );
      })}
      {form.label==="commission_agent"&&<InputField label="Commission %" type="number" value={form.commission} onChange={v=>set("commission",v)} placeholder="e.g. 5"/>}
      <InputField label="Remarks / notes" value={form.notes} onChange={v=>set("notes",v)} placeholder="Any note..."/>
      <PrimaryButton onClick={submit}><i className="ti ti-check"/> {existing?"Update member":"Save member"}</PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Member detail ─────────────────────────────────────────────
function MemberDetail({ member, onBack, onEdit }) {
  const { data, addCollection } = useApp();
  const stats   = getMemberStats(member.id, data.books, data.collections);
  const cfg     = LABELS[member.label]||LABELS.committee_member;
  const memberCols = data.collections.filter(c=>c.memberId===member.id).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
  const [tab, setTab] = useState("overview");
  const [collectingBook, setCollectingBook] = useState(null); // which book's form is open

  const byMode = { cash:0, upi:0, bank:0 };
  memberCols.forEach(c=>{ byMode[c.paymentMode||"cash"]+=(c.amount||0); });

  // Weekly mini chart
  const weeklyData = (()=>{
    const wks={};
    memberCols.forEach(c=>{
      const d=new Date(c.date); const wn=`W${Math.ceil(((d-new Date(d.getFullYear(),0,1))/86400000+1)/7)}`;
      wks[wn]=(wks[wn]||0)+(c.amount||0);
    });
    return Object.entries(wks).slice(-6);
  })();
  const maxWk=Math.max(...weeklyData.map(([,v])=>v),1);

  return(
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"10px 10px 14px" }}>

      {/* Profile card */}
      <div style={{ background:"#fff", borderRadius:12, border:"0.5px solid rgba(0,0,0,0.08)", padding:"12px 14px", marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, paddingBottom:10, borderBottom:"0.5px solid rgba(0,0,0,0.07)" }}>
          <div style={{ width:48,height:48,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:cfg.color,flexShrink:0 }}>
            {(member.firstName[0]+member.lastName[0]).toUpperCase()}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:15,fontWeight:700,color:"#1a1a1a" }}>{member.firstName} {member.lastName}</div>
            <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:3 }}><Badge type={member.label}/><span style={{ fontSize:10,color:"#888" }}>{member.id}</span></div>
          </div>
          <button onClick={onEdit} style={{ background:"#fff",border:`0.5px solid ${GREEN}`,color:GREEN,borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer" }}><i className="ti ti-edit"/> Edit</button>
        </div>
        {[
          member.phone    &&{icon:"ti-phone",           val:member.phone},
          member.whatsapp &&{icon:"ti-brand-whatsapp",  val:member.whatsapp},
          member.address  &&{icon:"ti-map-pin",         val:member.address},
          member.commission>0&&{icon:"ti-percentage",   val:`${member.commission}% commission`},
          member.notes    &&{icon:"ti-notes",           val:member.notes},
        ].filter(Boolean).map((row,i)=>(
          <div key={i} style={{ display:"flex",gap:8,alignItems:"center",padding:"4px 0",fontSize:12,color:"#444" }}>
            <i className={`ti ${row.icon}`} style={{ color:"#888",fontSize:14,width:16 }}/>{row.val}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
        {[
          {label:"Books assigned",  value:stats.memberBooks.length, color:"#1a1a1a"},
          {label:"Total collected", value:fmt(stats.totalCollected), color:GREEN},
          {label:"Tickets sold",    value:`${stats.soldTickets}/${stats.totalTickets}`, color:"#1a1a1a"},
          {label:"Balance due",     value:fmt(stats.totalPending), color:stats.totalPending>0?"#e65100":GREEN},
        ].map((s,i)=>(
          <div key={i} style={{ background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px" }}>
            <div style={{ fontSize:10,color:"#888" }}>{s.label}</div>
            <div style={{ fontSize:15,fontWeight:700,color:s.color,marginTop:2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Payment mode breakdown */}
      <div style={{ background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10 }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>Payment mode breakdown</div>
        <div style={{ display:"flex",gap:6 }}>
          {["cash","upi","bank"].map(mode=>(
            <div key={mode} style={{ flex:1,background:MODE_BG[mode],borderRadius:8,padding:"8px 6px",textAlign:"center" }}>
              <i className={`ti ${MODE_ICONS[mode]}`} style={{ color:MODE_COLORS[mode],fontSize:17 }}/>
              <div style={{ fontSize:9,color:MODE_COLORS[mode],fontWeight:700,marginTop:3 }}>{mode.toUpperCase()}</div>
              <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a",marginTop:2 }}>{fmt(byMode[mode])}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly trend */}
      {weeklyData.length>0&&(
        <div style={{ background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:10 }}>Weekly collection trend</div>
          <div style={{ display:"flex",alignItems:"flex-end",gap:4,height:48 }}>
            {weeklyData.map(([wk,amt])=>(
              <div key={wk} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3 }}>
                <div style={{ fontSize:8,color:"#888" }}>{fmt(amt).replace("Rs.","")}</div>
                <div style={{ width:"100%",background:GREEN,borderRadius:"3px 3px 0 0",height:`${Math.max(5,Math.round((amt/maxWk)*38))}px`,opacity:0.8 }}/>
                <div style={{ fontSize:8,color:"#aaa" }}>{wk}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:"flex",background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:4,marginBottom:10,gap:4 }}>
        {[["overview","Books & cash"],["payments","Payment history"]].map(([key,lbl])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ flex:1,padding:"7px 4px",borderRadius:7,border:"none",background:tab===key?GREEN:"transparent",color:tab===key?"#fff":"#888",fontSize:11,fontWeight:tab===key?700:400,cursor:"pointer" }}>{lbl}</button>
        ))}
      </div>

      {/* Overview tab */}
      {tab==="overview"&&(
        <>
          <SectionLabel>Assigned books</SectionLabel>
          {stats.memberBooks.length===0
            ?<div style={{ fontSize:12,color:"#888",textAlign:"center",padding:"20px 0" }}>No books assigned yet</div>
            :stats.memberBooks.map(book=>{
              const bs  = getBookStats(book,data.collections);
              const sr  = getSeriesFromBook(book.bookNumber);
              const pct = Math.round((bs.totalSold/book.ticketCount)*100);
              const isCollecting = collectingBook===book.id;
              return(
                <div key={book.id} style={{ background:"#fff",borderRadius:10,border:`1px solid ${isCollecting?GREEN:"#eee"}`,padding:"10px 12px",marginBottom:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:7 }}>
                    <div style={{ width:34,height:34,borderRadius:8,background:sr?sr.bg:"#f0ede8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:sr?sr.color:"#888",fontSize:13,flexShrink:0 }}>{book.bookNumber?.charAt(0)}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>Book {book.bookNumber}</div>
                      <div style={{ fontSize:10,color:"#888" }}>Tickets {book.ticketFrom}–{book.ticketTo} · Issued {book.issueDate||"—"}</div>
                    </div>
                    <span style={{ fontSize:9,padding:"2px 6px",borderRadius:7,fontWeight:700,background:book.status==="complete"?"#e8f5ee":book.status==="ongoing"?"#fff3e0":"#ffebee",color:book.status==="complete"?GREEN:book.status==="ongoing"?"#e65100":"#dc2626" }}>
                      {book.status==="complete"?"Complete":book.status==="ongoing"?"Ongoing":"Not started"}
                    </span>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:5,marginBottom:5 }}>
                    <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:book.status==="complete"?GREEN:"#4caf50",borderRadius:3 }}/></div>
                    <span style={{ fontSize:10,color:"#888" }}>{bs.totalSold}/{book.ticketCount}</span>
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:book.status!=="complete"?8:0 }}>
                    <span style={{ color:GREEN,fontWeight:700 }}>Collected: {fmt(bs.totalCollected)}</span>
                    <span style={{ color:bs.pending>0?"#e65100":"#888" }}>Pending: {fmt(bs.pending)}</span>
                  </div>
                  {/* Collect Cash button under each book */}
                  {book.status!=="complete"&&(
                    isCollecting?(
                      <InlineCollectCash book={book}
                        onSave={col=>{ addCollection(col); setCollectingBook(null); }}
                        onCancel={()=>setCollectingBook(null)}/>
                    ):(
                      <button onClick={()=>setCollectingBook(book.id)}
                        style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:8,padding:"8px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
                        <i className="ti ti-cash" style={{ fontSize:13 }}/> Collect Cash
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
            ?<div style={{ fontSize:12,color:"#888",textAlign:"center",padding:"20px 0" }}>No collections recorded yet</div>
            :memberCols.map((col,i)=>{
              const book=data.books.find(b=>b.id===col.bookId);
              const mode=col.paymentMode||"cash";
              return(
                <div key={col.id} style={{ background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:7 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <div style={{ width:32,height:32,borderRadius:8,background:MODE_BG[mode],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <i className={`ti ${MODE_ICONS[mode]}`} style={{ color:MODE_COLORS[mode],fontSize:16 }}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{fmt(col.amount)}</div>
                      <div style={{ fontSize:10,color:"#888",marginTop:1 }}>{col.date} · Book {book?.bookNumber||"—"} · {col.ticketsSold} tickets</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <span style={{ display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:8,fontWeight:700,background:MODE_BG[mode],color:MODE_COLORS[mode] }}>{mode.toUpperCase()}</span>
                      {col.remarks&&<div style={{ fontSize:9,color:"#888",marginTop:3 }}>{col.remarks}</div>}
                    </div>
                  </div>
                </div>
              );
            })
          }
          <SectionLabel>Total by payment mode</SectionLabel>
          <div style={{ display:"flex",gap:6 }}>
            {["cash","upi","bank"].map(mode=>(
              <div key={mode} style={{ flex:1,background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 6px",textAlign:"center" }}>
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
  const [view,     setView]    = useState("list");
  const [selected, setSelected]= useState(null);
  const [search,   setSearch]  = useState("");
  const [filterLabel, setFL]   = useState("all");

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
      <div><div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>{title}</div>{sub&&<div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>{sub}</div>}</div>
    </div>
  );

  if (view==="add")   return(<div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}><Header title="Add new member" sub="Coordinator · Registration" onBack={()=>setView("list")}/><MemberForm onSave={handleSave} onCancel={()=>setView("list")}/></div>);
  if (view==="edit"&&selected) return(<div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}><Header title="Edit member" onBack={()=>setView("detail")}/><MemberForm onSave={handleSave} onCancel={()=>setView("detail")} existing={data.members.find(m=>m.id===selected.id)}/></div>);
  if (view==="detail"&&selected){
    const live=data.members.find(m=>m.id===selected.id)||selected;
    return(<div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}><Header title={`${live.firstName} ${live.lastName}`} sub="Member profile" onBack={()=>setView("list")}/><MemberDetail member={live} onBack={()=>setView("list")} onEdit={()=>setView("edit")}/></div>);
  }

  return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <div style={{ background:GREEN,padding:"10px 14px 12px" }}>
        <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Members</div>
        <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>{data.members.length} registered</div>
      </div>
      <div style={{ background:"#f5f7f5",flex:1,overflowY:"auto",padding:"10px 10px 4px" }}>
        <div style={{ display:"flex",gap:6,marginBottom:8 }}>
          <div style={{ flex:1,background:"#fff",borderRadius:9,border:"0.5px solid rgba(0,0,0,0.12)",display:"flex",alignItems:"center",padding:"0 10px",gap:6 }}>
            <i className="ti ti-search" style={{ color:"#ccc",fontSize:15 }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, ID..."
              style={{ flex:1,border:"none",outline:"none",fontSize:12,color:"#1a1a1a",background:"transparent",padding:"9px 0" }}/>
            {search&&<button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",color:"#aaa" }}><i className="ti ti-x" style={{ fontSize:13 }}/></button>}
          </div>
          <button onClick={()=>setView("add")} style={{ background:GREEN,color:"#fff",border:"none",borderRadius:9,padding:"8px 13px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:4 }}>
            <i className="ti ti-plus"/> Add
          </button>
        </div>

        <div style={{ display:"flex",gap:4,marginBottom:10,flexWrap:"wrap" }}>
          {[["all","All"],["committee_member","Committee"],["outside_member","Outside"],["commission_agent","Agent"],["common","Common"]].map(([v,l])=>(
            <div key={v} onClick={()=>setFL(v)} style={{ background:filterLabel===v?GREEN:"#fff",color:filterLabel===v?"#fff":"#666",border:`0.5px solid ${filterLabel===v?GREEN:"rgba(0,0,0,0.12)"}`,borderRadius:14,padding:"4px 10px",fontSize:10,fontWeight:filterLabel===v?700:400,cursor:"pointer" }}>
              {l} {v!=="all"&&`(${data.members.filter(m=>m.label===v).length})`}
            </div>
          ))}
        </div>

        {filtered.length===0&&<div style={{ textAlign:"center",color:"#888",fontSize:12,padding:"30px 0" }}>No members found</div>}

        {filtered.map(m=>{
          const stats=getMemberStats(m.id,data.books,data.collections);
          const cfg=LABELS[m.label]||LABELS.committee_member;
          return(
            <div key={m.id} onClick={()=>{setSelected(m);setView("detail");}} style={{ background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
              <div style={{ width:38,height:38,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:cfg.color,flexShrink:0 }}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
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
