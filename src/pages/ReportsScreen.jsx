import { useState } from "react";
import { useApp } from "../data/AppContext";
import { getBookStats, getMemberStats, LABELS, fmt } from "../data/store";
import { BOOK_SERIES, getSeriesFromBook, TOTAL_TICKETS, TICKET_PRICE } from "../data/bookConfig";
import { Card, SectionLabel, Badge, Avatar, StatusBadge } from "../components/UI";
import { generateCombinedPDF, downloadPDF, printPDF } from "../utils/pdfGenerator";

const RED="#8B0000", GOLD="#FFD700";

const REPORT_DEFS = [
  { id:"summary",   title:"Summary Report",             sub:"Grand total · series breakdown · member table",      icon:"ti-chart-bar",      iconBg:"#EAF3DE",color:"#3B6D11",pages:"~2 pages",  tags:["Grand total","Series A/B/C","Member summary"] },
  { id:"coupon",    title:"Coupon Sale Report",          sub:"Book-wise · ticket ranges · collected vs pending",   icon:"ti-ticket",         iconBg:"#E6F1FB",color:"#185FA5",pages:"~3 pages",  tags:["All books","Ticket ranges","Status"] },
  { id:"member",    title:"Member-wise Report",          sub:"Each member · books · collection history",           icon:"ti-user",           iconBg:"#FAEEDA",color:"#854F0B",pages:"~4 pages",  tags:["Profile","Books assigned","Payment history"] },
  { id:"pending",   title:"Pending / Defaulters",        sub:"Members with outstanding balance",                   icon:"ti-alert-triangle", iconBg:"#FCEBEB",color:"#A32D2D",pages:"~1 page",   tags:["Overdue members","Amount","Contact"] },
  { id:"inventory", title:"Book Inventory Report",       sub:"All 500 books · A/B/C series · issued vs available", icon:"ti-books",          iconBg:"#EEEDFE",color:"#3C3489",pages:"~2 pages",  tags:["500 books","Series","Return status"] },
  { id:"history",   title:"Collection History",          sub:"All cash entries · date-wise · payment mode",        icon:"ti-calendar",       iconBg:"#EAF3DE",color:"#3B6D11",pages:"~5 pages",  tags:["All entries","Cash/UPI/Bank","Running total"] },
  { id:"remittance",title:"Remittance Report",         sub:"Money sent to treasurer · mode-wise · member-wise",      icon:"ti-send",           iconBg:"#e3f2fd",color:"#1565c0",pages:"~2 pages",  tags:["Sent to treasurer","Cash/UPI/Bank","Per member"] },
  { id:"common",    title:"Common Ticket Sales",         sub:"Coordinator common books · each ticket with buyer name", icon:"ti-pool",           iconBg:"#f3e5f5",color:"#4a148c",pages:"~2 pages",  tags:["Common books","Ticket numbers","Buyer names"] },
  { id:"remittance",title:"Remittance Report",             sub:"Money sent to treasurer · mode breakdown · balance",      icon:"ti-send",          iconBg:"#e3f2fd",color:"#1565c0",pages:"~2 pages",  tags:["Money sent","Mode breakdown","Balance in hand"] },
];

function ReportPreview({ reportId, data }) {
  const { books, collections, members } = data;
  const totalC = collections.reduce((s,c)=>s+(c.amount||0),0);
  const totalV = TOTAL_TICKETS*TICKET_PRICE;
  const sold   = collections.reduce((s,c)=>s+(c.ticketsSold||0),0);

  const Hdr = () => (
    <div style={{background:RED,borderRadius:10,padding:"10px 12px",marginBottom:10}}>
      <div style={{fontSize:9,color:GOLD}}>Niranam Chudan Vallasamithi & NBC · Reg. PTM/TC/105/2022</div>
      <div style={{color:"#fff",fontSize:13,fontWeight:500,marginTop:4}}>{REPORT_DEFS.find(r=>r.id===reportId)?.title}</div>
      <div style={{color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:2}}>Generated {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div>
    </div>
  );
  const TotalBar = ({label,value}) => (
    <div style={{display:"flex",justifyContent:"space-between",padding:"9px 12px",background:RED,borderRadius:8,margin:"8px 0"}}>
      <span style={{fontSize:12,fontWeight:500,color:GOLD}}>{label}</span>
      <span style={{fontSize:14,fontWeight:500,color:GOLD}}>{value}</span>
    </div>
  );
  const Row = ({label,value,color}) => (
    <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)",fontSize:11}}>
      <span style={{color:"#5F5E5A"}}>{label}</span>
      <span style={{fontWeight:500,color:color||"#2C2C2A"}}>{value}</span>
    </div>
  );

  if (reportId==="summary") return (
    <div>
      <Hdr/>
      <div style={{background:RED,borderRadius:10,padding:"12px 14px",marginBottom:10}}>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>Total collected</div>
        <div style={{fontSize:26,fontWeight:500,color:GOLD}}>{fmt(totalC)}</div>
        <div style={{fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:2}}>{sold}/{TOTAL_TICKETS} tickets sold</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10}}>
          {[["Books assigned",books.length],["Complete",books.filter(b=>b.status==="complete").length],["Pending",fmt(totalV-totalC)],["Members",members.length]].map(([l,v])=>(
            <div key={l} style={{background:"rgba(255,255,255,0.1)",borderRadius:7,padding:"6px 8px"}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.55)"}}>{l}</div>
              <div style={{fontSize:12,fontWeight:500,color:"#fff"}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Series breakdown</SectionLabel>
      {Object.entries(BOOK_SERIES).map(([key,s])=>{
        const sb=books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
        const sc=sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.amount||0),0),0);
        const ss=sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.ticketsSold||0),0),0);
        const pct=Math.round((ss/(s.totalBooks*s.ticketsPerBook))*100);
        return (
          <div key={key} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px",marginBottom:5}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:26,height:26,borderRadius:6,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:500,color:s.color,fontSize:12}}>{key}</div>
                <div><div style={{fontSize:11,fontWeight:500,color:"#2C2C2A"}}>{s.name} · {s.ticketsPerBook}t/book</div><div style={{fontSize:9,color:"#888780"}}>{s.totalBooks} books · Tickets {s.ticketStart}–{s.ticketEnd}</div></div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:500,color:"#3B6D11"}}>{fmt(sc)}</div><div style={{fontSize:9,color:"#888780"}}>{sb.length} assigned</div></div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{flex:1,height:5,background:"#f0ede8",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:pct===100?"#639922":"#EF9F27",borderRadius:3}}/></div>
              <span style={{fontSize:9,color:"#888780"}}>{ss}/{s.totalBooks*s.ticketsPerBook}</span>
            </div>
          </div>
        );
      })}
      <SectionLabel>Member summary</SectionLabel>
      {members.map(m=>{
        const s=getMemberStats(m.id,books,collections);
        if (s.totalCollected===0&&s.totalPending===0) return null;
        return (
          <div key={m.id} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"7px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:LABELS[m.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:LABELS[m.label]?.color,flexShrink:0}}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontSize:11,fontWeight:500,color:"#2C2C2A"}}>{m.firstName} {m.lastName}</div><div style={{fontSize:9,color:"#888780"}}>{s.memberBooks.length} books · {s.soldTickets} tickets</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,fontWeight:500,color:"#3B6D11"}}>{fmt(s.totalCollected)}</div>{s.totalPending>0&&<div style={{fontSize:9,color:"#854F0B"}}>{fmt(s.totalPending)} due</div>}</div>
          </div>
        );
      })}
      <TotalBar label="Grand total collected" value={fmt(totalC)}/>
    </div>
  );

  if (reportId==="coupon") return (
    <div>
      <Hdr/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
        {[["Books",books.length],["Tickets sold",`${sold}/${TOTAL_TICKETS}`],["Collected",fmt(totalC)],["Pending",fmt(totalV-totalC)]].map(([l,v],i)=>(
          <div key={i} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px"}}><div style={{fontSize:10,color:"#888780"}}>{l}</div><div style={{fontSize:14,fontWeight:500,color:i===2?"#3B6D11":i===3?"#854F0B":"#2C2C2A"}}>{v}</div></div>
        ))}
      </div>
      <SectionLabel>Book-wise detail ({books.length} books)</SectionLabel>
      {books.map(book=>{
        const s=getBookStats(book,collections); const m=members.find(x=>x.id===book.memberId); const sr=getSeriesFromBook(book.bookNumber);
        const pct=Math.round((s.totalSold/book.ticketCount)*100);
        return (
          <div key={book.id} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px",marginBottom:5}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <div><div style={{fontSize:11,fontWeight:500,color:"#2C2C2A"}}>Book {book.bookNumber} {sr&&<span style={{fontSize:9,background:sr.bg,color:sr.color,padding:"1px 5px",borderRadius:5,marginLeft:3}}>{sr.label}</span>}</div><div style={{fontSize:9,color:"#888780"}}>{m?.firstName} {m?.lastName} · Tickets {book.ticketFrom}–{book.ticketTo}</div></div>
              <StatusBadge status={book.status}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{flex:1,height:5,background:"#f0ede8",borderRadius:3,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:book.status==="complete"?"#639922":"#EF9F27",borderRadius:3}}/></div>
              <span style={{fontSize:10,color:"#3B6D11",fontWeight:500}}>{fmt(s.totalCollected)}</span>
              <span style={{fontSize:10,color:s.pending>0?"#854F0B":"#888780"}}>{fmt(s.pending)}</span>
            </div>
          </div>
        );
      })}
      <TotalBar label="Total collected" value={fmt(totalC)}/>
    </div>
  );

  if (reportId==="member") return (
    <div>
      <Hdr/>
      {members.map(m=>{
        const s=getMemberStats(m.id,books,collections); const cfg=LABELS[m.label]||LABELS.committee_member;
        return (
          <div key={m.id} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:8,borderBottom:"0.5px solid rgba(0,0,0,0.07)"}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:cfg.color,flexShrink:0}}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{m.firstName} {m.lastName}</div><Badge type={m.label}/><span style={{fontSize:9,color:"#888780",marginLeft:4}}>{m.id}</span></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:12,fontWeight:500,color:"#3B6D11"}}>{fmt(s.totalCollected)}</div>{s.totalPending>0&&<div style={{fontSize:10,color:"#854F0B"}}>{fmt(s.totalPending)} due</div>}</div>
            </div>
            {s.memberBooks.map(book=>{
              const bs=getBookStats(book,collections);
              return <div key={book.id} style={{background:"#f7f4f0",borderRadius:7,padding:"6px 8px",marginBottom:4,fontSize:11,display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:500}}>{book.bookNumber} · {bs.totalSold}/{book.ticketCount} sold</span><span style={{color:"#3B6D11"}}>{fmt(bs.totalCollected)}</span></div>;
            })}
            {/* Payment history */}
            {collections.filter(c=>c.memberId===m.id).slice(0,3).map(col=>{
              const book=books.find(b=>b.id===col.bookId);
              return <div key={col.id} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderTop:"0.5px solid rgba(0,0,0,0.05)",fontSize:10,color:"#888780"}}><span>{col.date} · {book?.bookNumber} · {(col.paymentMode||"cash").toUpperCase()}</span><span style={{color:"#3B6D11",fontWeight:500}}>{fmt(col.amount)}</span></div>;
            })}
          </div>
        );
      })}
    </div>
  );

  if (reportId==="pending") {
    const pm=members.map(m=>({...m,...getMemberStats(m.id,books,collections)})).filter(m=>m.totalPending>0);
    return (
      <div>
        <Hdr/>
        <div style={{background:"#FAEEDA",borderRadius:8,padding:"8px 10px",marginBottom:10,display:"flex",gap:6}}><i className="ti ti-alert-triangle" style={{color:"#854F0B",fontSize:14,flexShrink:0}}/><span style={{fontSize:11,color:"#633806"}}>{pm.length} members have outstanding balance.</span></div>
        {pm.length===0?<div style={{textAlign:"center",color:"#3B6D11",fontSize:12,padding:"20px 0"}}>✅ All collections complete!</div>:pm.map(m=>(
          <div key={m.id} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:LABELS[m.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:LABELS[m.label]?.color,flexShrink:0}}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{m.firstName} {m.lastName}</div><div style={{fontSize:10,color:"#888780"}}>{m.phone} · {m.memberBooks.length} books</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:500,color:"#A32D2D"}}>{fmt(m.totalPending)}</div></div>
          </div>
        ))}
        <TotalBar label="Total pending" value={fmt(pm.reduce((s,m)=>s+m.totalPending,0))}/>
      </div>
    );
  }

  if (reportId==="inventory") return (
    <div>
      <Hdr/>
      {Object.entries(BOOK_SERIES).map(([key,s])=>{
        const sb=books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
        return (
          <div key={key} style={{marginBottom:12}}>
            <div style={{background:s.bg,borderRadius:8,padding:"7px 10px",marginBottom:6,display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:11,fontWeight:500,color:s.color}}>{s.name} — {s.ticketsPerBook} tickets/book</div>
              <div style={{fontSize:10,color:s.color}}>{sb.length}/{s.totalBooks} assigned</div>
            </div>
            {sb.map(book=>{const m=members.find(x=>x.id===book.memberId);return(
              <div key={book.id} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:7,border:"0.5px solid rgba(0,0,0,0.08)",padding:"6px 10px",marginBottom:3,fontSize:11}}>
                <span style={{fontWeight:500,color:"#2C2C2A",minWidth:42}}>Book {book.bookNumber}</span>
                <span style={{color:"#888780",flex:1}}>Tickets {book.ticketFrom}–{book.ticketTo}</span>
                <span style={{color:"#888780"}}>{m?`${m.firstName} ${m.lastName}`:"—"}</span>
                <StatusBadge status={book.status}/>
              </div>
            );})}
          </div>
        );
      })}
    </div>
  );

  if (reportId==="history") {
    const sorted=[...collections].sort((a,b)=>new Date(b.date)-new Date(a.date));
    return (
      <div>
        <Hdr/>
        <SectionLabel>All entries ({sorted.length})</SectionLabel>
        {sorted.map(col=>{
          const book=books.find(b=>b.id===col.bookId); const m=members.find(x=>x.id===col.memberId);
          const mode=col.paymentMode||"cash"; const modeC={cash:"#3B6D11",upi:"#185FA5",bank:"#854F0B"}[mode];
          return(
            <div key={col.id} style={{display:"flex",alignItems:"flex-start",gap:7,marginBottom:5}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:modeC,flexShrink:0,marginTop:4}}/>
              <div style={{flex:1,background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"7px 10px"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:11,fontWeight:500,color:"#2C2C2A"}}>{m?.firstName} {m?.lastName} — Book {book?.bookNumber}</span>
                  <span style={{fontSize:12,fontWeight:500,color:"#3B6D11"}}>{fmt(col.amount)}</span>
                </div>
                <div style={{fontSize:10,color:"#888780",marginTop:2}}>{col.date} · {col.ticketsSold} tickets · <span style={{color:modeC,fontWeight:500}}>{mode.toUpperCase()}</span></div>
              </div>
            </div>
          );
        })}
        <TotalBar label="Total collected" value={fmt(sorted.reduce((s,c)=>s+(c.amount||0),0))}/>
      </div>
    );
  }
  if (reportId==="common") {
    const commonBooks = books.filter(b=>b.isCommon);
    const commonCols  = collections.filter(c=>{ const b=books.find(x=>x.id===c.bookId); return b?.isCommon; });
    const totalAmt    = commonCols.reduce((s,c)=>s+(c.amount||0),0);
    const totalTickets= commonCols.reduce((s,c)=>s+(c.ticketsSold||0),0);
    return (
      <div>
        <Hdr/>
        <div style={{background:"#f3e5f5",borderRadius:10,padding:"12px 14px",marginBottom:10,border:"1px solid #ce93d830"}}>
          <div style={{fontSize:10,color:"#7b1fa2",marginBottom:4}}>Common ticket sales — coordinator managed</div>
          <div style={{fontSize:22,fontWeight:700,color:"#4a148c"}}>{fmt(totalAmt)}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}>
            {[["Common books",commonBooks.length],["Tickets sold",totalTickets]].map(([l,v])=>(
              <div key={l} style={{background:"rgba(255,255,255,0.7)",borderRadius:7,padding:"6px 8px",textAlign:"center"}}>
                <div style={{fontSize:9,color:"#888"}}>{l}</div>
                <div style={{fontSize:14,fontWeight:700,color:"#4a148c"}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <SectionLabel>Ticket-wise buyer details</SectionLabel>
        {commonCols.length===0
          ?<div style={{textAlign:"center",color:"#aaa",fontSize:12,padding:"20px 0"}}>No common ticket sales yet</div>
          :commonCols.map(col=>{
            const book=books.find(b=>b.id===col.bookId);
            return(
              <div key={col.id} style={{background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:"#1a1a1a"}}>Book {book?.bookNumber||"—"} · {col.date}</div>
                    <div style={{fontSize:10,color:"#888"}}>{col.ticketsSold} ticket{col.ticketsSold!==1?"s":""} · {(col.paymentMode||"cash").toUpperCase()}</div>
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:"#4a148c"}}>{fmt(col.amount)}</div>
                </div>
                {col.ticketEntries&&col.ticketEntries.length>0&&(
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#7b1fa2",marginBottom:5}}>Ticket details</div>
                    {col.ticketEntries.map((e,i)=>(
                      <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid #f5f5f5",fontSize:11}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{background:"#f3e5f5",color:"#4a148c",fontWeight:700,fontSize:10,padding:"2px 6px",borderRadius:5}}>#{e.ticketNo}</span>
                          <span style={{color:"#1a1a1a",fontWeight:600}}>{e.buyerName}</span>
                        </div>
                        <span style={{color:"#1a6b3c",fontWeight:700}}>{fmt(e.amount||1000)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        }
        <TotalBar label="Total common ticket sales" value={fmt(totalAmt)}/>
      </div>
    );
  }
  return null;
}

export default function ReportsScreen() {
  const { data, showToast } = useApp();
  const [selected, setSelected]   = useState(new Set(["summary","coupon","member","pending"]));
  const [viewing, setViewing]     = useState(null);
  const [generating, setGen]      = useState(false);

  const toggle = id => setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const selAll = () => selected.size===REPORT_DEFS.length ? setSelected(new Set()) : setSelected(new Set(REPORT_DEFS.map(r=>r.id)));

  async function handleDownload() {
    if (selected.size===0) return;
    setGen(true);
    try {
      const ids = REPORT_DEFS.filter(r=>selected.has(r.id)).map(r=>r.id);
      const doc = generateCombinedPDF(ids, data);
      downloadPDF(doc, `NCB_Reports_${selected.size}_sections`);
      showToast(`Downloaded ${ids.length} reports in 1 PDF`);
    } catch(e) { console.error(e); showToast("PDF generation failed","error"); }
    finally { setGen(false); }
  }

  async function handlePrint() {
    if (selected.size===0) return;
    setGen(true);
    try {
      const ids = REPORT_DEFS.filter(r=>selected.has(r.id)).map(r=>r.id);
      const doc = generateCombinedPDF(ids, data);
      printPDF(doc);
    } catch(e) { showToast("Print failed","error"); }
    finally { setGen(false); }
  }

  async function handleSingleDownload(id) {
    setGen(true);
    try {
      const doc = generateCombinedPDF([id], data);
      downloadPDF(doc, `NCB_${id}_report`);
      showToast(`${REPORT_DEFS.find(r=>r.id===id)?.title} downloaded`);
    } catch(e) { showToast("Failed","error"); }
    finally { setGen(false); }
  }

  if (viewing) {
    const def = REPORT_DEFS.find(r=>r.id===viewing);
    return (
      <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
        <div style={{background:RED,padding:"10px 14px 12px",display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setViewing(null)} style={{background:"none",border:"none",color:GOLD,fontSize:20,cursor:"pointer",padding:0}}><i className="ti ti-arrow-left"/></button>
          <div style={{flex:1}}><div style={{color:"#fff",fontSize:14,fontWeight:500}}>{def.title}</div><div style={{color:"rgba(255,255,255,0.65)",fontSize:10}}>Preview · Download · Print</div></div>
        </div>
        <div style={{background:"#fff",padding:"8px 10px",display:"flex",gap:6,borderBottom:"0.5px solid rgba(0,0,0,0.08)"}}>
          <button onClick={()=>handleSingleDownload(viewing)} disabled={generating} style={{flex:2,background:generating?"#ccc":RED,color:GOLD,border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:500,cursor:generating?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            {generating?<><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/>Generating...</>:<><i className="ti ti-download"/>Download PDF</>}
          </button>
          <button onClick={async()=>{setGen(true);try{const doc=generateCombinedPDF([viewing],data);printPDF(doc);}catch(e){}finally{setGen(false);}}} style={{flex:1,background:"#fff",color:RED,border:`0.5px solid ${RED}`,borderRadius:8,padding:"9px",fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <i className="ti ti-printer"/>Print
          </button>
        </div>
        <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"10px 10px 14px"}}>
          <ReportPreview reportId={viewing} data={data}/>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:RED,padding:"10px 14px 12px"}}>
        <div style={{fontSize:9,color:GOLD}}>Niranam Chudan Vallasamithi & NBC</div>
        <div style={{color:"#fff",fontSize:15,fontWeight:500,marginTop:2}}>Reports</div>
        <div style={{color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:2}}>Select reports → download as 1 combined PDF</div>
      </div>
      <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"10px 10px 14px"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <button onClick={selAll} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:RED,background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:500}}>
            <i className="ti ti-checks" style={{fontSize:15}}/>{selected.size===REPORT_DEFS.length?"Deselect all":"Select all"}
          </button>
          <span style={{fontSize:11,color:"#888780"}}>{selected.size} of {REPORT_DEFS.length} selected</span>
        </div>

        {REPORT_DEFS.map(r=>(
          <div key={r.id} style={{background:"#fff",borderRadius:10,border:`0.5px solid ${selected.has(r.id)?"rgba(139,0,0,0.3)":"rgba(0,0,0,0.08)"}`,marginBottom:8,overflow:"hidden",opacity:selected.has(r.id)?1:0.6,transition:"opacity 0.2s"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px"}}>
              <div onClick={()=>toggle(r.id)} style={{width:22,height:22,borderRadius:5,border:`1.5px solid ${selected.has(r.id)?RED:"rgba(0,0,0,0.2)"}`,background:selected.has(r.id)?RED:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}>
                {selected.has(r.id)&&<i className="ti ti-check" style={{color:GOLD,fontSize:13}}/>}
              </div>
              <div style={{width:34,height:34,borderRadius:8,background:r.iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <i className={`ti ${r.icon}`} style={{color:r.color,fontSize:16}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{r.title}</div>
                <div style={{fontSize:10,color:"#888780",marginTop:1}}>{r.sub}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5}}>
                <span style={{fontSize:9,color:"#888780"}}>{r.pages}</span>
                <button onClick={()=>setViewing(r.id)} style={{background:"#fff",border:`0.5px solid ${RED}`,color:RED,borderRadius:6,padding:"3px 9px",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}>
                  <i className="ti ti-eye" style={{fontSize:11}}/>View
                </button>
              </div>
            </div>
            <div style={{background:"#f7f4f0",borderTop:"0.5px solid rgba(0,0,0,0.06)",padding:"6px 12px",display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
              {r.tags.map(t=><span key={t} style={{fontSize:9,background:"#fff",border:"0.5px solid rgba(0,0,0,0.1)",borderRadius:5,padding:"2px 7px",color:"#5F5E5A"}}>{t}</span>)}
              <div style={{marginLeft:"auto",display:"flex",gap:4}}>
                <button onClick={()=>handleSingleDownload(r.id)} style={{background:RED,color:GOLD,border:"none",borderRadius:6,padding:"3px 8px",fontSize:10,cursor:"pointer"}}><i className="ti ti-download" style={{fontSize:10}}/> PDF</button>
              </div>
            </div>
          </div>
        ))}

        {selected.size>0 && (
          <div style={{background:"#fff",borderRadius:10,border:`1.5px solid ${RED}`,padding:"10px 12px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
              <i className="ti ti-file-text" style={{color:RED,fontSize:15}}/>
              Combined PDF will include {selected.size} report{selected.size>1?"s":""} in order:
            </div>
            {REPORT_DEFS.filter(r=>selected.has(r.id)).map((r,i)=>(
              <div key={r.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"0.5px solid rgba(0,0,0,0.05)",fontSize:11}}>
                <div style={{width:18,height:18,borderRadius:4,background:RED,color:GOLD,fontSize:10,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                <span style={{flex:1,color:"#2C2C2A"}}>{r.title}</span>
                <span style={{color:"#888780",fontSize:10}}>{r.pages}</span>
              </div>
            ))}
            <div style={{marginTop:8,paddingTop:6,borderTop:"0.5px solid rgba(0,0,0,0.08)",fontSize:11,color:"#854F0B",fontWeight:500,textAlign:"right"}}>
              Each section separated by a divider page · Auto page numbers & letterhead
            </div>
          </div>
        )}

        <div style={{background:"#EAF3DE",borderRadius:8,padding:"7px 10px",marginBottom:10,display:"flex",gap:6}}>
          <i className="ti ti-info-circle" style={{color:"#3B6D11",fontSize:14,flexShrink:0}}/>
          <span style={{fontSize:11,color:"#27500A",lineHeight:1.5}}>All selected reports merge into <strong>one PDF file</strong>. Each section gets a divider page, org letterhead, and page numbers.</span>
        </div>

        <div style={{display:"flex",gap:6}}>
          <button onClick={handleDownload} disabled={selected.size===0||generating} style={{flex:2,background:selected.size>0&&!generating?RED:"#ccc",color:selected.size>0&&!generating?GOLD:"#fff",border:"none",borderRadius:9,padding:"12px 4px",fontSize:13,fontWeight:500,cursor:selected.size>0&&!generating?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {generating?<><i className="ti ti-loader-2" style={{animation:"spin 1s linear infinite"}}/>Generating PDF...</>:<><i className="ti ti-download"/>Download {selected.size} Report{selected.size!==1?"s":""} — 1 PDF</>}
          </button>
          <button onClick={handlePrint} disabled={selected.size===0||generating} style={{flex:1,background:"#fff",color:selected.size>0?RED:"#ccc",border:`0.5px solid ${selected.size>0?RED:"#ccc"}`,borderRadius:9,padding:"12px 4px",fontSize:12,fontWeight:500,cursor:selected.size>0?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
            <i className="ti ti-printer"/>Print
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
