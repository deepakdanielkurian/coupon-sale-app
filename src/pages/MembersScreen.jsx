import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getMemberStats, getBookStats, fmt } from "../data/store";
import { generateMemberId } from "../data/store";
import { getSeriesFromBook } from "../data/bookConfig";
import { Card, Badge, Avatar, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip } from "../components/UI";

const RED="#8B0000", GOLD="#FFD700";

const MODE_ICONS = { cash:"ti-cash", upi:"ti-device-mobile", bank:"ti-building-bank" };
const MODE_COLORS = { cash:"#3B6D11", upi:"#185FA5", bank:"#854F0B" };
const MODE_BG = { cash:"#EAF3DE", upi:"#E6F1FB", bank:"#FAEEDA" };

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
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave(form);
  }

  const labelDefs = [
    { key:"committee_member", icon:"ti-users",     desc:"Existing committee member selling books" },
    { key:"outside_member",   icon:"ti-user",      desc:"Non-committee person given a book to sell" },
    { key:"commission_agent", icon:"ti-handshake", desc:"Agent selling on behalf; earns commission" },
    { key:"common",           icon:"ti-star",      desc:"Common member (general category)" },
  ];

  return (
    <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"12px 10px 14px"}}>
      <SectionLabel>Personal details</SectionLabel>
      <div style={{display:"flex",gap:6}}>
        <div style={{flex:1}}><InputField label="First name" required value={form.firstName} onChange={v=>set("firstName",v)} error={errors.firstName}/></div>
        <div style={{flex:1}}><InputField label="Last name"  required value={form.lastName}  onChange={v=>set("lastName",v)}  error={errors.lastName}/></div>
      </div>
      <InputField label="Phone number"    required value={form.phone}    onChange={v=>set("phone",v)}    placeholder="+91 94470 ..." error={errors.phone}/>
      <InputField label="WhatsApp number"          value={form.whatsapp} onChange={v=>set("whatsapp",v)} placeholder="Same as phone or different"/>
      <InputField label="House / address"          value={form.address}  onChange={v=>set("address",v)}  placeholder="House name, street..."/>

      <SectionLabel>Label / category</SectionLabel>
      <InfoChip>This label identifies how this person is connected to the coupon sale.</InfoChip>

      {labelDefs.map(({key,icon,desc}) => {
        const cfg = LABELS[key];
        return (
          <div key={key} onClick={()=>set("label",key)} style={{background:"#fff",borderRadius:10,border:`${form.label===key?"1.5px":"0.5px"} solid ${form.label===key?RED:"rgba(0,0,0,0.08)"}`,padding:"10px 12px",marginBottom:6,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
            <div style={{width:32,height:32,borderRadius:8,background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",color:cfg.color,fontSize:15,flexShrink:0}}><i className={`ti ${icon}`}/></div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:"#2C2C2A"}}>{cfg.label}</div>
              <div style={{fontSize:10,color:"#888780",marginTop:1}}>{desc}</div>
            </div>
            <div style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${form.label===key?RED:"#ccc"}`,background:form.label===key?RED:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {form.label===key && <div style={{width:7,height:7,borderRadius:"50%",background:"#fff"}}/>}
            </div>
          </div>
        );
      })}

      {form.label==="commission_agent" && (
        <InputField label="Commission %" type="number" value={form.commission} onChange={v=>set("commission",v)} placeholder="e.g. 5"/>
      )}
      <InputField label="Remarks / notes" value={form.notes} onChange={v=>set("notes",v)} placeholder="Any note about this person..."/>

      <PrimaryButton onClick={submit}><i className="ti ti-check"/> {existing?"Update member":"Save member"}</PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

function MemberDetail({ member, onBack, onEdit }) {
  const { data } = useApp();
  const stats    = getMemberStats(member.id, data.books, data.collections);
  const cfg      = LABELS[member.label] || LABELS.committee_member;
  const memberCols = data.collections.filter(c=>c.memberId===member.id).sort((a,b)=>new Date(b.date)-new Date(a.date));

  // Aggregate by payment mode
  const byMode = { cash:0, upi:0, bank:0 };
  memberCols.forEach(c=>{ byMode[c.paymentMode||"cash"] += (c.amount||0); });

  // Weekly grouping (last 6 weeks)
  const weeks = {};
  memberCols.forEach(c=>{
    const d = new Date(c.date);
    const wk = `${d.getFullYear()}-W${String(Math.ceil((d.getDate())/7)).padStart(2,"0")}`;
    weeks[wk] = (weeks[wk]||0) + (c.amount||0);
  });
  const weekEntries = Object.entries(weeks).slice(-6);
  const maxWk = Math.max(...weekEntries.map(([,v])=>v),1);

  const [tab, setTab] = useState("overview"); // overview | books | payments

  return (
    <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"10px 10px 14px"}}>

      {/* Profile card */}
      <div style={{background:"#fff",borderRadius:12,border:"0.5px solid rgba(0,0,0,0.08)",padding:"12px 14px",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,paddingBottom:10,borderBottom:"0.5px solid rgba(0,0,0,0.07)"}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:500,color:cfg.color,flexShrink:0}}>
            {(member.firstName[0]+member.lastName[0]).toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:500,color:"#2C2C2A"}}>{member.firstName} {member.lastName}</div>
            <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
              <Badge type={member.label}/>
              <span style={{fontSize:10,color:"#888780"}}>{member.id}</span>
            </div>
          </div>
          <button onClick={onEdit} style={{background:"#fff",border:`0.5px solid ${RED}`,color:RED,borderRadius:7,padding:"5px 10px",fontSize:11,cursor:"pointer"}}><i className="ti ti-edit"/> Edit</button>
        </div>
        {[
          member.phone    && { icon:"ti-phone",            val:member.phone },
          member.whatsapp && { icon:"ti-brand-whatsapp",   val:member.whatsapp },
          member.address  && { icon:"ti-map-pin",          val:member.address },
          member.commission>0 && { icon:"ti-percentage",   val:`${member.commission}% commission` },
          member.notes    && { icon:"ti-notes",            val:member.notes },
        ].filter(Boolean).map((row,i)=>(
          <div key={i} style={{display:"flex",gap:8,alignItems:"center",padding:"4px 0",fontSize:12,color:"#444441"}}>
            <i className={`ti ${row.icon}`} style={{color:"#888780",fontSize:14,width:16}}/>
            {row.val}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
        {[
          { label:"Books assigned",  value:stats.memberBooks.length,         color:"#2C2C2A" },
          { label:"Total collected", value:fmt(stats.totalCollected),         color:"#3B6D11" },
          { label:"Tickets sold",    value:`${stats.soldTickets}/${stats.totalTickets}`, color:"#2C2C2A" },
          { label:"Balance due",     value:fmt(stats.totalPending),           color:stats.totalPending>0?"#854F0B":"#3B6D11" },
        ].map((s,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px"}}>
            <div style={{fontSize:10,color:"#888780"}}>{s.label}</div>
            <div style={{fontSize:15,fontWeight:500,color:s.color,marginTop:2}}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Payment mode breakdown */}
      <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
        <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:8}}>Payment mode breakdown</div>
        <div style={{display:"flex",gap:6}}>
          {["cash","upi","bank"].map(mode=>(
            <div key={mode} style={{flex:1,background:MODE_BG[mode],borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
              <i className={`ti ${MODE_ICONS[mode]}`} style={{color:MODE_COLORS[mode],fontSize:18}}/>
              <div style={{fontSize:10,color:MODE_COLORS[mode],fontWeight:500,marginTop:3}}>{mode.toUpperCase()}</div>
              <div style={{fontSize:13,fontWeight:500,color:"#2C2C2A",marginTop:2}}>{fmt(byMode[mode])}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly trend mini chart */}
      {weekEntries.length>0 && (
        <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:8}}>Weekly collection trend</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:4,height:50}}>
            {weekEntries.map(([wk,amt])=>(
              <div key={wk} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:"100%",background:RED,borderRadius:"3px 3px 0 0",height:`${Math.max(4,Math.round((amt/maxWk)*44))}px`}}/>
                <div style={{fontSize:8,color:"#888780",textAlign:"center"}}>{fmt(amt).replace("₹","")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{display:"flex",background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:4,marginBottom:10,gap:4}}>
        {[["overview","Books"],["payments","Cash history"]].map(([key,lbl])=>(
          <button key={key} onClick={()=>setTab(key)} style={{flex:1,padding:"7px 4px",borderRadius:7,border:"none",background:tab===key?RED:"transparent",color:tab===key?GOLD:"#888780",fontSize:11,fontWeight:tab===key?500:400,cursor:"pointer"}}>
            {lbl}
          </button>
        ))}
      </div>

      {tab==="overview" && (
        <>
          <SectionLabel>Assigned books</SectionLabel>
          {stats.memberBooks.length===0
            ? <div style={{fontSize:12,color:"#888780",textAlign:"center",padding:"20px 0"}}>No books assigned yet</div>
            : stats.memberBooks.map(book=>{
                const bs  = getBookStats(book,data.collections);
                const sr  = getSeriesFromBook(book.bookNumber);
                const pct = Math.round((bs.totalSold/book.ticketCount)*100);
                return (
                  <div key={book.id} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:7}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                      <div style={{width:34,height:34,borderRadius:8,background:sr?sr.bg:"#f0ede8",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500,color:sr?sr.color:"#888",fontSize:14,flexShrink:0}}>{book.bookNumber?.charAt(0)}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>Book {book.bookNumber}</div>
                        <div style={{fontSize:10,color:"#888780"}}>Tickets {book.ticketFrom}–{book.ticketTo} · Issued {book.issueDate||"—"}</div>
                      </div>
                      <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,fontWeight:500,background:book.status==="complete"?"#EAF3DE":book.status==="ongoing"?"#FAEEDA":"#FCEBEB",color:book.status==="complete"?"#3B6D11":book.status==="ongoing"?"#854F0B":"#A32D2D"}}>
                        {book.status==="complete"?"Complete":book.status==="ongoing"?"Ongoing":"Not started"}
                      </span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <div style={{flex:1,height:6,background:"#f0ede8",borderRadius:3,overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:book.status==="complete"?"#639922":"#EF9F27",borderRadius:3}}/>
                      </div>
                      <span style={{fontSize:10,color:"#888780"}}>{bs.totalSold}/{book.ticketCount}</span>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11}}>
                      <span style={{color:"#3B6D11",fontWeight:500}}>Collected: {fmt(bs.totalCollected)}</span>
                      <span style={{color:bs.pending>0?"#854F0B":"#888780"}}>Pending: {fmt(bs.pending)}</span>
                    </div>
                  </div>
                );
              })
          }
        </>
      )}

      {tab==="payments" && (
        <>
          <SectionLabel>Cash collection history</SectionLabel>
          {memberCols.length===0
            ? <div style={{fontSize:12,color:"#888780",textAlign:"center",padding:"20px 0"}}>No collections recorded yet</div>
            : memberCols.map((col,i)=>{
                const book = data.books.find(b=>b.id===col.bookId);
                const mode = col.paymentMode||"cash";
                return (
                  <div key={col.id} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:7}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:32,height:32,borderRadius:8,background:MODE_BG[mode],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <i className={`ti ${MODE_ICONS[mode]}`} style={{color:MODE_COLORS[mode],fontSize:16}}/>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{fmt(col.amount)}</div>
                        <div style={{fontSize:10,color:"#888780",marginTop:1}}>
                          {col.date} · Book {book?.bookNumber||"—"} · {col.ticketsSold} tickets
                        </div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <span style={{display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:8,fontWeight:500,background:MODE_BG[mode],color:MODE_COLORS[mode]}}>
                          {mode.toUpperCase()}
                        </span>
                        {col.remarks && <div style={{fontSize:9,color:"#888780",marginTop:3}}>{col.remarks}</div>}
                      </div>
                    </div>
                  </div>
                );
              })
          }
          {/* Mode totals */}
          <SectionLabel>Total by payment mode</SectionLabel>
          <div style={{display:"flex",gap:6}}>
            {["cash","upi","bank"].map(mode=>(
              <div key={mode} style={{flex:1,background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 6px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#888780"}}>{mode.toUpperCase()}</div>
                <div style={{fontSize:13,fontWeight:500,color:MODE_COLORS[mode],marginTop:3}}>{fmt(byMode[mode])}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MembersScreen() {
  const { data, addMember, updateMember } = useApp();
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterLabel, setFilterLabel] = useState("all");

  const filtered = data.members.filter(m => {
    const labelMatch = filterLabel==="all" || m.label===filterLabel;
    const searchMatch = `${m.firstName} ${m.lastName} ${m.phone} ${m.id}`.toLowerCase().includes(search.toLowerCase());
    return labelMatch && searchMatch;
  });

  function handleSave(form) {
    if (view==="edit" && selected) {
      updateMember(selected.id, form);
      setSelected({...selected,...form});
      setView("detail");
    } else {
      const id = generateMemberId(data.members);
      addMember({...form, id, createdAt: new Date().toISOString().split("T")[0]});
      setView("list");
    }
  }

  const Header = ({title,sub,onBack}) => (
    <div style={{background:RED,padding:"10px 14px 12px",display:"flex",alignItems:"center",gap:10}}>
      {onBack && <button onClick={onBack} style={{background:"none",border:"none",color:GOLD,fontSize:20,cursor:"pointer",padding:0}}><i className="ti ti-arrow-left"/></button>}
      <div><div style={{color:"#fff",fontSize:15,fontWeight:500}}>{title}</div>{sub&&<div style={{color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:2}}>{sub}</div>}</div>
    </div>
  );

  if (view==="add")   return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}><Header title="Add new member" sub="Coordinator · Registration" onBack={()=>setView("list")}/><MemberForm onSave={handleSave} onCancel={()=>setView("list")}/></div>;
  if (view==="edit" && selected) return <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}><Header title="Edit member" onBack={()=>setView("detail")}/><MemberForm onSave={handleSave} onCancel={()=>setView("detail")} existing={data.members.find(m=>m.id===selected.id)}/></div>;
  if (view==="detail" && selected) {
    const live = data.members.find(m=>m.id===selected.id)||selected;
    return (
      <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
        <Header title={`${live.firstName} ${live.lastName}`} sub="Member profile" onBack={()=>setView("list")}/>
        <MemberDetail member={live} onBack={()=>setView("list")} onEdit={()=>setView("edit")}/>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:RED,padding:"10px 14px 12px"}}>
        <div style={{color:"#fff",fontSize:15,fontWeight:500}}>Members</div>
        <div style={{color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:2}}>{data.members.length} registered</div>
      </div>
      <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"10px 10px 4px"}}>
        {/* Search + Add */}
        <div style={{display:"flex",gap:6,marginBottom:8}}>
          <div style={{flex:1,background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.12)",display:"flex",alignItems:"center",padding:"0 10px",gap:6}}>
            <i className="ti ti-search" style={{color:"#888780",fontSize:15}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, phone, ID..." style={{flex:1,border:"none",outline:"none",fontSize:12,color:"#2C2C2A",background:"transparent",padding:"8px 0"}}/>
          </div>
          <button onClick={()=>setView("add")} style={{background:RED,color:GOLD,border:"none",borderRadius:8,padding:"8px 12px",fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <i className="ti ti-plus"/> Add
          </button>
        </div>

        {/* Label filter */}
        <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
          {[["all","All"],["committee_member","Committee"],["outside_member","Outside"],["commission_agent","Agent"],["common","Common"]].map(([v,l])=>(
            <div key={v} onClick={()=>setFilterLabel(v)} style={{background:filterLabel===v?RED:"#fff",color:filterLabel===v?GOLD:"#5F5E5A",border:`0.5px solid ${filterLabel===v?RED:"rgba(0,0,0,0.12)"}`,borderRadius:14,padding:"4px 10px",fontSize:10,cursor:"pointer"}}>
              {l} {v!=="all"&&`(${data.members.filter(m=>m.label===v).length})`}
            </div>
          ))}
        </div>

        {filtered.length===0 && <div style={{textAlign:"center",color:"#888780",fontSize:12,padding:"30px 0"}}>No members found</div>}

        {filtered.map(m=>{
          const stats = getMemberStats(m.id, data.books, data.collections);
          const cfg   = LABELS[m.label]||LABELS.committee_member;
          return (
            <div key={m.id} onClick={()=>{setSelected(m);setView("detail");}} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:7,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:cfg.color,flexShrink:0}}>
                {(m.firstName[0]+m.lastName[0]).toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:"#2C2C2A"}}>{m.firstName} {m.lastName}</div>
                <div style={{display:"flex",alignItems:"center",gap:5,marginTop:3}}>
                  <Badge type={m.label}/>
                  <span style={{fontSize:10,color:"#888780"}}>{m.phone}</span>
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,fontWeight:500,color:"#3B6D11"}}>{fmt(stats.totalCollected)}</div>
                <div style={{fontSize:10,color:stats.totalPending>0?"#854F0B":"#888780"}}>{stats.memberBooks.length} books</div>
              </div>
              <i className="ti ti-chevron-right" style={{color:"#ccc",fontSize:14,marginLeft:4}}/>
            </div>
          );
        })}
      </div>
    </div>
  );
}
