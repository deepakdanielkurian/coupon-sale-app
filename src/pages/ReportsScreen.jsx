import { useState } from "react";
import { useApp } from "../data/AppContext";
import { getBookStats, getMemberStats, LABELS, fmt } from "../data/store";
import { BOOK_SERIES, getSeriesFromBook, TOTAL_TICKETS, TICKET_PRICE } from "../data/bookConfig";
import { SectionLabel, Badge, StatusBadge } from "../components/UI";
import { generateCombinedPDF, downloadPDF, printPDF } from "../utils/pdfGenerator";

const GREEN = "#1a6b3c";

// ─────────────────────────────────────────────────────────────
// Report preview — inline screen view for each report type
// ─────────────────────────────────────────────────────────────
function ReportPreview({ reportId, data }) {
  const { books, collections, members, remittances=[] } = data;
  const totalC  = collections.reduce((s,c)=>s+(c.amount||0),0);
  const totalV  = TOTAL_TICKETS * TICKET_PRICE;
  const sold    = collections.reduce((s,c)=>s+(c.ticketsSold||0),0);

  const Hdr = () => (
    <div style={{ background:GREEN, borderRadius:10, padding:"10px 12px", marginBottom:10 }}>
      <div style={{ fontSize:9, color:"rgba(255,255,255,0.6)" }}>Niranam Chudan Vallasamithi & NBC</div>
      <div style={{ color:"#fff", fontSize:13, fontWeight:700, marginTop:3 }}>
        {REPORT_DEFS.find(r=>r.id===reportId)?.title}
      </div>
      <div style={{ color:"rgba(255,255,255,0.6)", fontSize:10, marginTop:2 }}>
        Generated {new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}
      </div>
    </div>
  );

  const TotalBar = ({label,value,color=GREEN}) => (
    <div style={{ display:"flex",justifyContent:"space-between",padding:"10px 12px",background:GREEN,borderRadius:8,margin:"8px 0" }}>
      <span style={{ fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.8)" }}>{label}</span>
      <span style={{ fontSize:14,fontWeight:700,color:"#fff" }}>{value}</span>
    </div>
  );

  const Row = ({label,value,color}) => (
    <div style={{ display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid #f5f5f5",fontSize:11 }}>
      <span style={{ color:"#777" }}>{label}</span>
      <span style={{ fontWeight:700,color:color||"#1a1a1a" }}>{value}</span>
    </div>
  );

  // ── SUMMARY ──────────────────────────────────────────────
  if (reportId==="summary") return (
    <div>
      <Hdr/>
      <div style={{ background:GREEN,borderRadius:10,padding:"12px 14px",marginBottom:10 }}>
        <div style={{ fontSize:10,color:"rgba(255,255,255,0.6)" }}>Total collected</div>
        <div style={{ fontSize:26,fontWeight:700,color:"#fff" }}>{fmt(totalC)}</div>
        <div style={{ fontSize:10,color:"rgba(255,255,255,0.55)",marginTop:2 }}>{sold} of {TOTAL_TICKETS.toLocaleString()} tickets sold</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:10 }}>
          {[["Books",books.length],["Complete",books.filter(b=>b.status==="complete").length],["Pending",fmt(totalV-totalC)],["Members with books",members.length]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.15)",borderRadius:7,padding:"6px 8px" }}>
              <div style={{ fontSize:9,color:"rgba(255,255,255,0.55)" }}>{l}</div>
              <div style={{ fontSize:12,fontWeight:700,color:"#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Series breakdown</SectionLabel>
      {Object.entries(BOOK_SERIES).map(([key,s])=>{
        const sb=books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
        const sc=sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.amount||0),0),0);
        const ss=sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.ticketsSold||0),0),0);
        const total=s.totalBooks*s.ticketsPerBook;
        const pct=total>0?Math.round((ss/total)*100):0;
        return(
          <div key={key} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px",marginBottom:5 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5 }}>
              <div style={{ display:"flex",alignItems:"center",gap:7 }}>
                <div style={{ width:26,height:26,borderRadius:6,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,color:s.color,fontSize:12 }}>{key}</div>
                <div><div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a" }}>{s.name} · {s.ticketsPerBook}t/book</div><div style={{ fontSize:9,color:"#888" }}>{s.totalBooks} books</div></div>
              </div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(sc)}</div></div>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:pct===100?GREEN:s.color,borderRadius:3 }}/></div>
              <span style={{ fontSize:9,color:"#888" }}>{ss}/{total}</span>
            </div>
          </div>
        );
      })}
      <SectionLabel>Member summary</SectionLabel>
      {members.map(m=>{
        const s=getMemberStats(m.id,books,collections);
        if(s.totalCollected===0&&s.totalPending===0) return null;
        return(
          <div key={m.id} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"7px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:28,height:28,borderRadius:"50%",background:LABELS[m.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:LABELS[m.label]?.color,flexShrink:0 }}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div><div style={{ fontSize:9,color:"#888" }}>{s.memberBooks.length} books</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:11,fontWeight:700,color:GREEN }}>{fmt(s.totalCollected)}</div>{s.totalPending>0&&<div style={{ fontSize:9,color:"#e65100" }}>{fmt(s.totalPending)} due</div>}</div>
          </div>
        );
      })}
      <TotalBar label="Grand total collected" value={fmt(totalC)}/>
    </div>
  );

  // ── COUPON SALE ───────────────────────────────────────────
  if (reportId==="coupon") return (
    <div>
      <Hdr/>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8 }}>
        {[["Books",books.length],["Tickets sold",`${sold}/${TOTAL_TICKETS}`],["Collected",fmt(totalC)],["Pending",fmt(totalV-totalC)]].map(([l,v],i)=>(
          <div key={i} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px" }}>
            <div style={{ fontSize:10,color:"#888" }}>{l}</div>
            <div style={{ fontSize:14,fontWeight:700,color:i===2?GREEN:i===3?"#e65100":"#1a1a1a" }}>{v}</div>
          </div>
        ))}
      </div>
      <SectionLabel>Book-wise detail ({books.filter(b=>!b.isCommon).length} member books)</SectionLabel>
      {books.filter(b=>!b.isCommon).map(book=>{
        const s=getBookStats(book,collections);
        const m=members.find(x=>x.id===book.memberId||x.memberId===book.memberId);
        const pct=Math.round((s.totalSold/book.ticketCount)*100);
        return(
          <div key={book.id} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px",marginBottom:5 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
              <div>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{book.isCommon?"Common book":m?`${m.firstName} ${m.lastName}`:"—"}</div>
                <div style={{ fontSize:10,color:"#888" }}>Book {book.bookNumber} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
              </div>
              <StatusBadge status={book.status}/>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:5 }}>
              <div style={{ flex:1,height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}><div style={{ width:`${pct}%`,height:"100%",background:book.status==="complete"?GREEN:"#4caf50",borderRadius:3 }}/></div>
              <span style={{ fontSize:10,color:GREEN,fontWeight:700 }}>{fmt(s.totalCollected)}</span>
            </div>
          </div>
        );
      })}
      <TotalBar label="Total collected" value={fmt(totalC)}/>
    </div>
  );

  // ── MEMBER-WISE ───────────────────────────────────────────
  if (reportId==="member") return (
    <div>
      <Hdr/>
      {members.map(m=>{
        const s=getMemberStats(m.id,books,collections);
        const cfg=LABELS[m.label]||LABELS.committee_member;
        const mCols=collections.filter(c=>c.memberId===m.id||m.memberId===c.memberId).sort((a,b)=>new Date(b.date)-new Date(a.date));
        return(
          <div key={m.id} style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:10 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8,paddingBottom:8,borderBottom:"1px solid #f5f5f5" }}>
              <div style={{ width:34,height:34,borderRadius:"50%",background:cfg.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:cfg.color,flexShrink:0 }}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
              <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div><Badge type={m.label}/>{m.memberId&&m.memberId.startsWith('NCB-')&&<span style={{fontSize:9,color:"#aaa",marginLeft:5}}>{m.memberId}</span>}</div>
              <div style={{ textAlign:"right" }}><div style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(s.totalCollected)}</div>{s.totalPending>0&&<div style={{ fontSize:10,color:"#e65100" }}>{fmt(s.totalPending)} due</div>}</div>
            </div>
            {s.memberBooks.map(book=>{
              const bs=getBookStats(book,collections);
              return(<div key={book.id} style={{ background:"#f8faf8",borderRadius:7,padding:"6px 8px",marginBottom:4,fontSize:11,display:"flex",justifyContent:"space-between" }}><span style={{ fontWeight:700 }}>Book {book.bookNumber} · {bs.totalSold}/{book.ticketCount}</span><span style={{ color:GREEN }}>{fmt(bs.totalCollected)}</span></div>);
            })}
            {mCols.slice(0,5).map(col=>{
              const book=books.find(b=>b.id===col.bookId);
              return(<div key={col.id} style={{ display:"flex",justifyContent:"space-between",padding:"3px 0",borderTop:"0.5px solid #f5f5f5",fontSize:10,color:"#888" }}><span>{col.date} · Book {book?.bookNumber} · {(col.paymentMode||"cash").toUpperCase()}</span><span style={{ color:GREEN,fontWeight:700 }}>{fmt(col.amount)}</span></div>);
            })}
          </div>
        );
      })}
    </div>
  );

  // ── PENDING ───────────────────────────────────────────────
  if (reportId==="pending") {
    const pm=members.map(m=>({...m,...getMemberStats(m.id,books,collections)})).filter(m=>m.totalPending>0).sort((a,b)=>b.totalPending-a.totalPending);
    return(
      <div>
        <Hdr/>
        <div style={{ background:"#fff8e1",border:"1px solid #ffe082",borderRadius:8,padding:"8px 10px",marginBottom:10,display:"flex",gap:6 }}>
          <i className="ti ti-alert-triangle" style={{ color:"#e65100",fontSize:14,flexShrink:0 }}/>
          <span style={{ fontSize:11,color:"#bf360c" }}>{pm.length} members have outstanding balance.</span>
        </div>
        {pm.length===0?<div style={{ textAlign:"center",color:GREEN,fontSize:12,padding:"20px 0" }}>✅ All collections complete!</div>:pm.map(m=>(
          <div key={m.id} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px",marginBottom:5,display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:LABELS[m.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:LABELS[m.label]?.color,flexShrink:0 }}>{(m.firstName[0]+m.lastName[0]).toUpperCase()}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div><div style={{ fontSize:10,color:"#888" }}>{m.phone}</div></div>
            <div style={{ textAlign:"right" }}><div style={{ fontSize:13,fontWeight:700,color:"#c62828" }}>{fmt(m.totalPending)}</div></div>
          </div>
        ))}
        <TotalBar label="Total pending" value={fmt(pm.reduce((s,m)=>s+m.totalPending,0))}/>
      </div>
    );
  }

  // ── INVENTORY ─────────────────────────────────────────────
  if (reportId==="inventory") return (
    <div>
      <Hdr/>
      {Object.entries(BOOK_SERIES).map(([key,s])=>{
        const sb=books.filter(b=>!b.isCommon&&(b.series===key||b.bookNumber?.startsWith(key)));
        return(
          <div key={key} style={{ marginBottom:12 }}>
            <div style={{ background:s.bg,borderRadius:8,padding:"7px 10px",marginBottom:6,display:"flex",justifyContent:"space-between" }}>
              <span style={{ fontSize:11,fontWeight:700,color:s.color }}>{s.name} — {s.ticketsPerBook}t/book</span>
              <span style={{ fontSize:10,color:s.color }}>{sb.length}/{s.totalBooks} assigned</span>
            </div>
            {sb.map(book=>{
              const m=members.find(x=>x.id===book.memberId);
              return(
                <div key={book.id} style={{ display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:7,border:"1px solid #eee",padding:"6px 10px",marginBottom:3,fontSize:11 }}>
                  <span style={{ fontWeight:700,color:"#1a1a1a",minWidth:38 }}>Book {book.bookNumber}</span>
                  <span style={{ color:"#888",flex:1 }}>Tickets {book.ticketFrom}–{book.ticketTo}</span>
                  <span style={{ color:"#888" }}>{m?`${m.firstName} ${m.lastName}`:"—"}</span>
                  <StatusBadge status={book.status}/>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  // ── COLLECTION HISTORY ────────────────────────────────────
  if (reportId==="history") {
    const sorted=[...collections].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const modeC={cash:0,upi:0,bank:0};
    sorted.forEach(c=>{ modeC[c.paymentMode||"cash"]+=(c.amount||0); });
    return(
      <div>
        <Hdr/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10 }}>
          {[["Cash",modeC.cash,GREEN],["UPI",modeC.upi,"#1565c0"],["Bank",modeC.bank,"#7b4400"]].map(([l,v,c])=>(
            <div key={l} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"7px 8px",textAlign:"center" }}>
              <div style={{ fontSize:9,color:"#888" }}>{l}</div>
              <div style={{ fontSize:13,fontWeight:700,color:c,marginTop:2 }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
        <SectionLabel>All entries ({sorted.length})</SectionLabel>
        {sorted.map(col=>{
          const book=books.find(b=>b.id===col.bookId);
          const m=members.find(x=>x.id===col.memberId);
          const mode=col.paymentMode||"cash";
          const mc={cash:GREEN,upi:"#1565c0",bank:"#7b4400"}[mode];
          return(
            <div key={col.id} style={{ display:"flex",alignItems:"flex-start",gap:7,marginBottom:5 }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:mc,flexShrink:0,marginTop:4 }}/>
              <div style={{ flex:1,background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"7px 10px" }}>
                <div style={{ display:"flex",justifyContent:"space-between" }}>
                  <span style={{ fontSize:11,fontWeight:700,color:"#1a1a1a" }}>{m?`${m.firstName} ${m.lastName}`:"Common"} — Book {book?.bookNumber||"—"}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(col.amount)}</span>
                </div>
                <div style={{ fontSize:10,color:"#888",marginTop:2 }}>{col.date} · {col.ticketsSold} tickets · <span style={{ color:mc,fontWeight:700 }}>{mode.toUpperCase()}</span></div>
              </div>
            </div>
          );
        })}
        <TotalBar label="Total collected" value={fmt(sorted.reduce((s,c)=>s+(c.amount||0),0))}/>
      </div>
    );
  }

  // ── COMMON TICKETS ────────────────────────────────────────
  if (reportId==="common") {
    const commonBooks=books.filter(b=>b.isCommon);
    const commonCols=collections.filter(c=>{ const b=books.find(x=>x.id===c.bookId); return b?.isCommon; });
    const totalAmt=commonCols.reduce((s,c)=>s+(c.amount||0),0);
    return(
      <div>
        <Hdr/>
        <div style={{ background:"#f3e5f5",borderRadius:10,padding:"12px 14px",marginBottom:10 }}>
          <div style={{ fontSize:10,color:"#7b1fa2" }}>Common ticket sales</div>
          <div style={{ fontSize:22,fontWeight:700,color:"#4a148c" }}>{fmt(totalAmt)}</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8 }}>
            {[["Common books",commonBooks.length],["Tickets sold",commonCols.reduce((s,c)=>s+(c.ticketsSold||0),0)]].map(([l,v])=>(
              <div key={l} style={{ background:"rgba(255,255,255,0.7)",borderRadius:7,padding:"5px 8px" }}>
                <div style={{ fontSize:9,color:"#888" }}>{l}</div>
                <div style={{ fontSize:14,fontWeight:700,color:"#4a148c" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <SectionLabel>Ticket-wise buyer details</SectionLabel>
        {commonCols.length===0?<div style={{ textAlign:"center",color:"#aaa",fontSize:12,padding:"20px 0" }}>No common ticket sales yet</div>:commonCols.map(col=>{
          const book=books.find(b=>b.id===col.bookId);
          return(
            <div key={col.id} style={{ background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}>
                <div><div style={{ fontSize:12,fontWeight:700 }}>Book {book?.bookNumber||"—"} · {col.date}</div><div style={{ fontSize:10,color:"#888" }}>{col.ticketsSold} ticket(s) · {(col.paymentMode||"cash").toUpperCase()}</div></div>
                <div style={{ fontSize:13,fontWeight:700,color:"#4a148c" }}>{fmt(col.amount)}</div>
              </div>
              {col.ticketEntries&&col.ticketEntries.map((e,i)=>(
                <div key={i} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"4px 0",borderBottom:"0.5px solid #f5f5f5",fontSize:11 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ background:"#f3e5f5",color:"#4a148c",fontWeight:700,fontSize:10,padding:"2px 6px",borderRadius:5 }}>#{e.ticketNo}</span>
                    <span style={{ color:"#1a1a1a",fontWeight:600 }}>{e.buyerName}</span>
                  </div>
                  <span style={{ color:GREEN,fontWeight:700 }}>{fmt(e.amount||1000)}</span>
                </div>
              ))}
            </div>
          );
        })}
        <TotalBar label="Total common ticket sales" value={fmt(totalAmt)}/>
      </div>
    );
  }

  // ── REMITTANCE ────────────────────────────────────────────
  if (reportId==="remittance") {
    const totalRemitted=remittances.reduce((s,r)=>s+(r.amount||0),0);
    const balance=totalC-totalRemitted;
    const byMode={cash:0,upi:0,bank:0};
    collections.forEach(c=>{ byMode[c.paymentMode||"cash"]+=(c.amount||0); });
    const memberRows=members.map(m=>{
      const mCols=collections.filter(c=>c.memberId===m.id);
      const mTotal=mCols.reduce((s,c)=>s+(c.amount||0),0);
      const mByMode={cash:0,upi:0,bank:0};
      mCols.forEach(c=>{ mByMode[c.paymentMode||"cash"]+=(c.amount||0); });
      return {...m,total:mTotal,byMode:mByMode};
    }).filter(m=>m.total>0);
    return(
      <div>
        <Hdr/>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10 }}>
          {[["Total collected",fmt(totalC),GREEN],["Total remitted",fmt(totalRemitted),"#1565c0"],["Pending to send to treasurer",fmt(balance),balance>0?"#e65100":GREEN],["Remittances",remittances.length,"#1a1a1a"]].map(([l,v,c])=>(
            <div key={l} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px" }}>
              <div style={{ fontSize:10,color:"#888" }}>{l}</div>
              <div style={{ fontSize:14,fontWeight:700,color:c,marginTop:2 }}>{v}</div>
            </div>
          ))}
        </div>
        <SectionLabel>Collected by payment mode</SectionLabel>
        <div style={{ display:"flex",gap:6,marginBottom:10 }}>
          {[["Cash",byMode.cash,GREEN,"ti-cash"],["UPI",byMode.upi,"#1565c0","ti-device-mobile"],["Bank",byMode.bank,"#7b4400","ti-building-bank"]].map(([l,v,c,icon])=>(
            <div key={l} style={{ flex:1,background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 6px",textAlign:"center" }}>
              <i className={`ti ${icon}`} style={{ fontSize:17,color:c }}/>
              <div style={{ fontSize:9,color:c,fontWeight:700,marginTop:3 }}>{l}</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginTop:2 }}>{fmt(v)}</div>
            </div>
          ))}
        </div>
        <SectionLabel>Member-wise collected</SectionLabel>
        {memberRows.map(m=>(
          <div key={m.id} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"8px 10px",marginBottom:5 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:3 }}>
              <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div>
              <div style={{ fontSize:13,fontWeight:700,color:GREEN }}>{fmt(m.total)}</div>
            </div>
            <div style={{ display:"flex",gap:10,fontSize:10,color:"#888" }}>
              {m.byMode.cash>0&&<span style={{ color:GREEN }}>Cash: {fmt(m.byMode.cash)}</span>}
              {m.byMode.upi>0&&<span style={{ color:"#1565c0" }}>UPI: {fmt(m.byMode.upi)}</span>}
              {m.byMode.bank>0&&<span style={{ color:"#7b4400" }}>Bank: {fmt(m.byMode.bank)}</span>}
            </div>
          </div>
        ))}
        <SectionLabel>Remittance history</SectionLabel>
        {remittances.length===0?<div style={{ fontSize:12,color:"#aaa",textAlign:"center",padding:"12px 0" }}>No remittances recorded yet</div>:remittances.map((r,i)=>(
          <div key={r.id} style={{ background:"#fff",borderRadius:8,border:"1px solid #eee",padding:"9px 11px",marginBottom:6 }}>
            <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
              <div><div style={{ fontSize:13,fontWeight:700,color:"#1565c0" }}>{fmt(r.amount)}</div><div style={{ fontSize:10,color:"#888" }}>{r.date} · To {r.toWhom} · {(r.paymentMode||"cash").toUpperCase()}</div></div>
              {i===0&&<span style={{ fontSize:9,fontWeight:700,background:"#e3f2fd",color:"#1565c0",padding:"2px 7px",borderRadius:6 }}>Latest</span>}
            </div>
            <div style={{ display:"flex",gap:5,fontSize:10 }}>
              <span style={{ color:"#888" }}>Before: {fmt(r.balanceBefore||0)}</span>
              <span style={{ color:"#888" }}>→</span>
              <span style={{ color:GREEN,fontWeight:700 }}>After: {fmt(r.balanceAfter||0)}</span>
            </div>
          </div>
        ))}
        <TotalBar label="Pending to send to treasurer" value={fmt(balance)}/>
      </div>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// Report definitions
// ─────────────────────────────────────────────────────────────
const REPORT_DEFS = [
  { id:"summary",    title:"Summary Report",           sub:"Grand total · series breakdown · member table",         icon:"ti-chart-bar",     iconBg:"#e8f5ee", color:GREEN,      pages:"~2 pages",  tags:["Grand total","A/B/C series","Member summary"] },
  { id:"coupon",     title:"Coupon Sale Report",        sub:"Book-wise · ticket ranges · collected vs pending",      icon:"ti-ticket",        iconBg:"#e3f2fd", color:"#1565c0",  pages:"~3 pages",  tags:["All books","Ticket ranges","Status"] },
  { id:"member",     title:"Member-wise Report",        sub:"Each member · books · collection history",              icon:"ti-user",          iconBg:"#fff3e0", color:"#7b4400",  pages:"~4 pages",  tags:["Profile","Books assigned","History"] },
  { id:"pending",    title:"Pending / Defaulters",      sub:"Members with outstanding balance",                      icon:"ti-alert-triangle",iconBg:"#ffebee", color:"#c62828",  pages:"~1 page",   tags:["Overdue","Amount due","Contact"] },
  { id:"inventory",  title:"Book Inventory Report",     sub:"All 500 books · A/B/C series · issued vs available",    icon:"ti-books",         iconBg:"#f3e5f5", color:"#4a148c",  pages:"~2 pages",  tags:["500 books","Series","Status"] },
  { id:"history",    title:"Collection History",        sub:"All cash entries · date-wise · payment mode",           icon:"ti-calendar",      iconBg:"#e8f5ee", color:GREEN,      pages:"~5 pages",  tags:["All entries","Cash/UPI/Bank","Total"] },
  { id:"common",     title:"Common Ticket Sales",       sub:"Common books · each ticket number with buyer name",     icon:"ti-pool",          iconBg:"#f3e5f5", color:"#4a148c",  pages:"~2 pages",  tags:["Common books","Ticket#","Buyer names"] },
  { id:"remittance", title:"Remittance Report",         sub:"Money sent to treasurer · mode breakdown · balance",    icon:"ti-send",          iconBg:"#e3f2fd", color:"#1565c0",  pages:"~2 pages",  tags:["Money sent","Mode breakdown","Balance"] },
];

// ─────────────────────────────────────────────────────────────
// Main Reports Screen
// ─────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const { data, showToast } = useApp();
  const [selected, setSelected] = useState(new Set(["summary","coupon","member","pending"]));
  const [viewing,  setViewing]  = useState(null);
  const [gen,      setGen]      = useState(false);

  const toggle  = id => setSelected(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); return n; });
  const selAll  = () => selected.size===REPORT_DEFS.length ? setSelected(new Set()) : setSelected(new Set(REPORT_DEFS.map(r=>r.id)));

  async function handleDownload(ids) {
    setGen(true);
    try {
      const doc = generateCombinedPDF(ids, data);
      downloadPDF(doc, `NBC_Reports_${ids.join("_")}`);
      showToast(`${ids.length} report${ids.length>1?"s":""} downloaded as 1 PDF`);
    } catch(e) {
      console.error("PDF error:", e);
      showToast("PDF generation failed — check console","error");
    } finally { setGen(false); }
  }

  async function handlePrint(ids) {
    setGen(true);
    try { const doc=generateCombinedPDF(ids,data); printPDF(doc); }
    catch(e){ showToast("Print failed","error"); }
    finally { setGen(false); }
  }

  // View mode
  if (viewing) {
    const def=REPORT_DEFS.find(r=>r.id===viewing);
    return(
      <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
        <div style={{ background:GREEN,padding:"10px 14px 12px",display:"flex",alignItems:"center",gap:10 }}>
          <button onClick={()=>setViewing(null)} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0 }}><i className="ti ti-arrow-left"/></button>
          <div style={{ flex:1 }}><div style={{ color:"#fff",fontSize:14,fontWeight:700 }}>{def?.title}</div><div style={{ color:"rgba(255,255,255,0.65)",fontSize:10 }}>Preview · then download or print</div></div>
        </div>
        <div style={{ background:"#fff",padding:"8px 10px",display:"flex",gap:6,borderBottom:"1px solid #eee" }}>
          <button onClick={()=>handleDownload([viewing])} disabled={gen}
            style={{ flex:2,background:gen?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:gen?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
            {gen?<><i className="ti ti-loader-2" style={{ animation:"spin 1s linear infinite" }}/> Generating...</>:<><i className="ti ti-download"/> Download PDF</>}
          </button>
          <button onClick={()=>handlePrint([viewing])} disabled={gen}
            style={{ flex:1,background:"#fff",color:GREEN,border:`1px solid ${GREEN}`,borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
            <i className="ti ti-printer"/> Print
          </button>
        </div>
        <div style={{ background:"#f5f7f5",flex:1,overflowY:"auto",padding:"10px 10px 14px" }}>
          <ReportPreview reportId={viewing} data={data}/>
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // Selection mode
  return(
    <div style={{ display:"flex",flexDirection:"column",flex:1,overflow:"hidden" }}>
      <div style={{ background:GREEN,padding:"10px 14px 12px" }}>
        <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Reports</div>
        <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>Select reports → download as 1 combined PDF</div>
      </div>
      <div style={{ background:"#f5f7f5",flex:1,overflowY:"auto",padding:"10px 10px 14px" }}>

        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
          <button onClick={selAll} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:GREEN,background:"none",border:"none",cursor:"pointer",padding:0 }}>
            <i className="ti ti-checks" style={{ fontSize:15 }}/>{selected.size===REPORT_DEFS.length?"Deselect all":"Select all"}
          </button>
          <span style={{ fontSize:11,color:"#888" }}>{selected.size} of {REPORT_DEFS.length} selected</span>
        </div>

        {REPORT_DEFS.map(r=>(
          <div key={r.id} style={{ background:"#fff",borderRadius:10,border:`1px solid ${selected.has(r.id)?"#a5d6a7":"#eee"}`,marginBottom:8,overflow:"hidden",opacity:selected.has(r.id)?1:0.6,transition:"all 0.2s" }}>
            <div style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px" }}>
              <div onClick={()=>toggle(r.id)} style={{ width:22,height:22,borderRadius:5,border:`2px solid ${selected.has(r.id)?GREEN:"#ccc"}`,background:selected.has(r.id)?GREEN:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s" }}>
                {selected.has(r.id)&&<i className="ti ti-check" style={{ color:"#fff",fontSize:13 }}/>}
              </div>
              <div style={{ width:34,height:34,borderRadius:8,background:r.iconBg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                <i className={`ti ${r.icon}`} style={{ color:r.color,fontSize:16 }}/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{r.title}</div>
                <div style={{ fontSize:10,color:"#888",marginTop:1 }}>{r.sub}</div>
              </div>
              <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:5 }}>
                <span style={{ fontSize:9,color:"#aaa" }}>{r.pages}</span>
                <button onClick={()=>setViewing(r.id)} style={{ background:"#fff",border:`1px solid ${GREEN}`,color:GREEN,borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,cursor:"pointer" }}>
                  <i className="ti ti-eye" style={{ fontSize:11 }}/> View
                </button>
              </div>
            </div>
            <div style={{ background:"#f8faf8",borderTop:"1px solid #f0f0f0",padding:"5px 12px",display:"flex",alignItems:"center",gap:5,flexWrap:"wrap" }}>
              {r.tags.map(t=><span key={t} style={{ fontSize:9,background:"#fff",border:"1px solid #eee",borderRadius:5,padding:"2px 6px",color:"#666" }}>{t}</span>)}
              <div style={{ marginLeft:"auto" }}>
                <button onClick={()=>handleDownload([r.id])} style={{ background:GREEN,color:"#fff",border:"none",borderRadius:6,padding:"3px 9px",fontSize:10,fontWeight:700,cursor:"pointer" }}>
                  <i className="ti ti-download" style={{ fontSize:10 }}/> PDF
                </button>
              </div>
            </div>
          </div>
        ))}

        {selected.size>0&&(
          <div style={{ background:"#fff",borderRadius:10,border:`1.5px solid ${GREEN}`,padding:"10px 12px",marginBottom:10 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#1a1a1a",marginBottom:8,display:"flex",alignItems:"center",gap:6 }}>
              <i className="ti ti-file-text" style={{ color:GREEN,fontSize:15 }}/>
              {selected.size} report{selected.size>1?"s":""} will merge into 1 PDF:
            </div>
            {REPORT_DEFS.filter(r=>selected.has(r.id)).map((r,i)=>(
              <div key={r.id} style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 0",borderBottom:"0.5px solid #f5f5f5",fontSize:11 }}>
                <div style={{ width:18,height:18,borderRadius:4,background:GREEN,color:"#fff",fontSize:10,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>{i+1}</div>
                <span style={{ flex:1 }}>{r.title}</span>
                <span style={{ color:"#aaa",fontSize:10 }}>{r.pages}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:"flex",gap:6 }}>
          <button onClick={()=>handleDownload(REPORT_DEFS.filter(r=>selected.has(r.id)).map(r=>r.id))} disabled={selected.size===0||gen}
            style={{ flex:2,background:selected.size>0&&!gen?`linear-gradient(135deg,${GREEN},#2e7d32)`:"#ccc",color:"#fff",border:"none",borderRadius:10,padding:"13px",fontSize:13,fontWeight:700,cursor:selected.size>0&&!gen?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
            {gen?<><i className="ti ti-loader-2" style={{ animation:"spin 1s linear infinite" }}/> Generating...</>:<><i className="ti ti-download"/> Download {selected.size} report{selected.size!==1?"s":""} — 1 PDF</>}
          </button>
          <button onClick={()=>handlePrint(REPORT_DEFS.filter(r=>selected.has(r.id)).map(r=>r.id))} disabled={selected.size===0||gen}
            style={{ flex:1,background:"#fff",color:selected.size>0?GREEN:"#ccc",border:`1px solid ${selected.size>0?GREEN:"#ccc"}`,borderRadius:10,padding:"13px",fontSize:12,fontWeight:700,cursor:selected.size>0?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:5 }}>
            <i className="ti ti-printer"/> Print
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
