import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getBookStats, fmt } from "../data/store";
import { BOOK_SERIES, ALL_BOOKS, TICKET_PRICE, TOTAL_TICKETS, getSeriesFromBook, getSeriesSummary } from "../data/bookConfig";
import { Card, Badge, Avatar, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip, StatusBadge } from "../components/UI";

const RED="#8B0000", GOLD="#FFD700";

function AssignBookForm({ onSave, onCancel }) {
  const { data } = useApp();
  const [memberId, setMemberId]         = useState("");
  const [selectedSeries, setSeries]     = useState("");
  const [bookNumber, setBookNumber]     = useState("");
  const [issueDate, setIssueDate]       = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes]               = useState("");
  const [errors, setErrors]             = useState({});

  const member      = data.members.find(m=>m.id===memberId);
  const memberBooks = memberId ? data.books.filter(b=>b.memberId===memberId) : [];
  const series      = selectedSeries ? BOOK_SERIES[selectedSeries] : null;
  const assigned    = data.books.map(b=>b.bookNumber);
  const available   = ALL_BOOKS.filter(b=>b.series===selectedSeries && !assigned.includes(b.bookNumber));
  const bookDef     = ALL_BOOKS.find(b=>b.bookNumber===bookNumber);

  function handleBookSelect(num) {
    setBookNumber(num);
  }

  function submit() {
    const e={};
    if (!memberId)    e.member="Select a member";
    if (!selectedSeries) e.series="Select a series";
    if (!bookNumber)  e.book="Select a book";
    if (Object.keys(e).length) { setErrors(e); return; }
    onSave({ bookNumber, series:selectedSeries, memberId, ticketCount:series.ticketsPerBook, ticketFrom:bookDef.ticketFrom, ticketTo:bookDef.ticketTo, issueDate, status:"not_started", notes });
  }

  return (
    <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"12px 10px 14px"}}>
      <SectionLabel>Select member</SectionLabel>
      <select value={memberId} onChange={e=>setMemberId(e.target.value)} style={{width:"100%",background:"#fff",border:`0.5px solid ${errors.member?"#E24B4A":memberId?RED:"rgba(0,0,0,0.15)"}`,borderRadius:8,padding:"9px 11px",fontSize:13,color:"#2C2C2A",marginBottom:4,boxSizing:"border-box"}}>
        <option value="">— choose member —</option>
        {data.members.map(m=><option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {LABELS[m.label]?.label||m.label}</option>)}
      </select>
      {errors.member && <div style={{fontSize:10,color:"#A32D2D",marginBottom:6}}>{errors.member}</div>}

      {member && (
        <div style={{background:"#fff",borderRadius:10,border:`1.5px solid ${RED}`,padding:"8px 12px",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:LABELS[member.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500,color:LABELS[member.label]?.color,flexShrink:0}}>{(member.firstName[0]+member.lastName[0]).toUpperCase()}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{member.firstName} {member.lastName}</div>
            <Badge type={member.label}/>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A"}}>{memberBooks.length} book{memberBooks.length!==1?"s":""} assigned</div>
          </div>
        </div>
      )}

      {memberBooks.length>0 && (
        <div style={{marginBottom:10}}>
          <div style={{fontSize:10,color:"#854F0B",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:5}}>Already assigned</div>
          {memberBooks.map(b=>(
            <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"6px 10px",marginBottom:4,fontSize:11}}>
              <span style={{fontWeight:500,color:"#2C2C2A",flex:1}}>Book {b.bookNumber}</span>
              <span style={{color:"#888780"}}>Tickets {b.ticketFrom}–{b.ticketTo}</span>
              <span style={{fontSize:9,padding:"2px 6px",borderRadius:6,fontWeight:500,background:b.status==="complete"?"#EAF3DE":b.status==="ongoing"?"#FAEEDA":"#FCEBEB",color:b.status==="complete"?"#3B6D11":b.status==="ongoing"?"#854F0B":"#A32D2D"}}>{b.status==="complete"?"Complete":b.status==="ongoing"?"Ongoing":"Not started"}</span>
            </div>
          ))}
        </div>
      )}

      <SectionLabel>Select book series</SectionLabel>
      {errors.series && <div style={{fontSize:10,color:"#A32D2D",marginBottom:4}}>{errors.series}</div>}
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {Object.entries(BOOK_SERIES).map(([key,s])=>{
          const rem = ALL_BOOKS.filter(b=>b.series===key && !assigned.includes(b.bookNumber)).length;
          return (
            <div key={key} onClick={()=>{setSeries(key);setBookNumber("");}} style={{flex:1,border:`${selectedSeries===key?"1.5px":"0.5px"} solid ${selectedSeries===key?RED:"rgba(0,0,0,0.12)"}`,borderRadius:10,padding:"10px 6px",background:selectedSeries===key?"#FFF5F5":"#fff",cursor:"pointer",textAlign:"center"}}>
              <div style={{width:30,height:30,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 5px",fontSize:15,fontWeight:500,color:s.color}}>{key}</div>
              <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A"}}>{s.ticketsPerBook} tickets</div>
              <div style={{fontSize:9,color:"#888780",marginTop:2}}>{rem} left</div>
            </div>
          );
        })}
      </div>

      {series && (
        <>
          <div style={{background:series.bg,borderRadius:8,padding:"7px 12px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:500,color:series.color}}>{series.name} — {series.label}</div>
            <div style={{fontSize:10,color:series.color,opacity:0.8,marginTop:2}}>Ticket range: {series.ticketStart}–{series.ticketEnd} · {available.length} books available</div>
          </div>

          <SectionLabel>Select book number</SectionLabel>
          {errors.book && <div style={{fontSize:10,color:"#A32D2D",marginBottom:4}}>{errors.book}</div>}
          <select value={bookNumber} onChange={e=>handleBookSelect(e.target.value)} style={{width:"100%",background:"#fff",border:`0.5px solid ${errors.book?"#E24B4A":bookNumber?RED:"rgba(0,0,0,0.15)"}`,borderRadius:8,padding:"9px 11px",fontSize:13,color:"#2C2C2A",marginBottom:10,boxSizing:"border-box"}}>
            <option value="">— choose book number —</option>
            {available.slice(0,150).map(b=><option key={b.bookNumber} value={b.bookNumber}>{b.bookNumber} (Tickets {b.ticketFrom}–{b.ticketTo})</option>)}
          </select>

          {/* Ticket range — READ ONLY display */}
          {bookDef && (
            <div style={{background:"#f0ede8",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
              <div style={{fontSize:10,color:"#854F0B",fontWeight:500,marginBottom:8}}>Ticket number range (auto-assigned)</div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{textAlign:"center",flex:1}}>
                  <div style={{fontSize:9,color:"#888780",marginBottom:4}}>From</div>
                  <div style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.12)",borderRadius:7,padding:"8px 4px",fontSize:14,fontWeight:500,textAlign:"center",color:series.color}}>{bookDef.ticketFrom}</div>
                </div>
                <div style={{color:"#888780",fontSize:16,marginTop:14}}>—</div>
                <div style={{textAlign:"center",flex:1}}>
                  <div style={{fontSize:9,color:"#888780",marginBottom:4}}>To</div>
                  <div style={{background:"#fff",border:"0.5px solid rgba(0,0,0,0.12)",borderRadius:7,padding:"8px 4px",fontSize:14,fontWeight:500,textAlign:"center",color:series.color}}>{bookDef.ticketTo}</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#888780",marginBottom:4}}>Count</div>
                  <div style={{fontSize:14,fontWeight:500,color:"#3B6D11"}}>{series.ticketsPerBook} tickets</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,background:"#EAF3DE",borderRadius:7,padding:"6px 8px"}}>
                <i className="ti ti-lock" style={{color:"#3B6D11",fontSize:13,flexShrink:0}}/>
                <span style={{fontSize:11,color:"#27500A"}}>Ticket range is fixed and auto-assigned. Cannot be edited.</span>
              </div>
            </div>
          )}

          {/* Only issue date */}
          <div style={{marginBottom:10}}>
            <div style={{fontSize:11,color:"#5F5E5A",marginBottom:4}}>Issue date *</div>
            <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} style={{width:"100%",background:"#fff",border:`0.5px solid ${RED}`,borderRadius:8,padding:"9px 11px",fontSize:13,color:"#2C2C2A",outline:"none",boxSizing:"border-box"}}/>
          </div>

          {/* Book value preview */}
          {bookDef && (
            <div style={{background:RED,borderRadius:10,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.6)"}}>Book {bookNumber} total value</div>
                <div style={{fontSize:18,fontWeight:500,color:"#fff",marginTop:2}}>{fmt(series.ticketsPerBook*1000)}</div>
                <div style={{fontSize:10,color:GOLD}}>Tickets {bookDef.ticketFrom}–{bookDef.ticketTo}</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{background:series.bg,color:series.color,fontSize:11,fontWeight:500,padding:"4px 10px",borderRadius:7,marginBottom:4}}>{series.name}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>{series.ticketsPerBook} × ₹1,000</div>
              </div>
            </div>
          )}

          <InputField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any instructions..."/>
        </>
      )}

      <PrimaryButton onClick={submit} disabled={!memberId||!selectedSeries||!bookNumber}>
        <i className="ti ti-ticket"/> Issue Book {bookNumber}{member?` to ${member.firstName}`:""}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

function CollectCashForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats  = getBookStats(book, data.collections);
  const member = data.members.find(m=>m.id===book.memberId);
  const series = getSeriesFromBook(book.bookNumber);
  const [date, setDate]           = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setSold]    = useState("");
  const [paymentMode, setMode]    = useState("cash");
  const [remarks, setRemarks]     = useState("");
  const [bookComplete, setComplete] = useState(false);

  const tickets   = parseInt(ticketsSold)||0;
  const amount    = tickets * TICKET_PRICE;
  const remaining = book.ticketCount - stats.totalSold;
  const newSold   = stats.totalSold + tickets;
  const newTotal  = stats.totalCollected + amount;
  const newPending= book.ticketCount*TICKET_PRICE - newTotal;
  const pct       = Math.round((newSold/book.ticketCount)*100);
  const willComplete = newSold >= book.ticketCount;

  function submit() {
    if (!tickets||tickets<=0||tickets>remaining) return;
    onSave({ id:`C-${Date.now()}`, bookId:book.id, memberId:book.memberId, date, ticketsSold:tickets, amount, paymentMode, remarks, bookCompleted: willComplete||bookComplete });
  }

  return (
    <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"12px 10px 14px"}}>

      {/* Book info */}
      <div style={{background:series?series.bg:"#f0ede8",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:"#2C2C2A"}}>Book {book.bookNumber}</div>
            <div style={{fontSize:10,color:"#888780"}}>{member?.firstName} {member?.lastName} · Issued {book.issueDate||"—"}</div>
            <div style={{fontSize:10,color:"#888780"}}>Tickets {book.ticketFrom}–{book.ticketTo}</div>
          </div>
          {series && <span style={{fontSize:10,fontWeight:500,color:series.color,background:"#fff",padding:"3px 8px",borderRadius:7}}>{series.label}</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
          {[["Total",book.ticketCount],["Sold",stats.totalSold],["Left",remaining]].map(([l,v])=>(
            <div key={l} style={{background:"rgba(255,255,255,0.7)",borderRadius:6,padding:"5px 7px",textAlign:"center"}}>
              <div style={{fontSize:9,color:"#888780"}}>{l}</div>
              <div style={{fontSize:15,fontWeight:500,color:"#2C2C2A"}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:7,fontSize:11}}>
          <span style={{color:"#3B6D11",fontWeight:500}}>Collected: {fmt(stats.totalCollected)}</span>
          <span style={{color:"#854F0B"}}>Pending: {fmt(stats.pending)}</span>
        </div>
      </div>

      <InfoChip>Amount = tickets × ₹1,000. Max {remaining} tickets remaining.</InfoChip>

      <SectionLabel>Cash collection entry</SectionLabel>
      <div style={{marginBottom:10}}>
        <div style={{fontSize:11,color:"#5F5E5A",marginBottom:4}}>Collection date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",background:"#fff",border:`0.5px solid ${RED}`,borderRadius:8,padding:"9px 11px",fontSize:13,color:"#2C2C2A",outline:"none",boxSizing:"border-box"}}/>
      </div>

      <InputField label={`Tickets sold (max ${remaining})`} type="number" value={ticketsSold} onChange={setSold} required error={tickets>remaining?`Max ${remaining}`:""}/>

      {/* Auto amount */}
      <div style={{background:"#f0ede8",borderRadius:8,padding:"10px 12px",marginBottom:10}}>
        <div style={{fontSize:11,color:"#5F5E5A",marginBottom:2}}>Amount received (auto)</div>
        <div style={{fontSize:28,fontWeight:500,color:RED}}>{fmt(amount)}</div>
        <div style={{fontSize:10,color:"#888780"}}>{tickets} tickets × ₹1,000</div>
      </div>

      {/* After-entry preview */}
      {tickets>0 && tickets<=remaining && (
        <div style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:500,color:"#2C2C2A",marginBottom:8}}>After this entry</div>
          {[["Tickets sold",`${newSold} / ${book.ticketCount}`],["Remaining",`${book.ticketCount-newSold} left`,book.ticketCount-newSold===0?"#3B6D11":"#854F0B"],["Collected",fmt(newTotal),"#3B6D11"],["Balance",fmt(Math.max(0,newPending)),newPending<=0?"#3B6D11":"#854F0B"],["Progress",`${pct}%`]].map(([l,v,c],i,arr)=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<arr.length-1?"0.5px solid rgba(0,0,0,0.05)":"none",fontSize:11}}>
              <span style={{color:"#5F5E5A"}}>{l}</span><span style={{fontWeight:500,color:c||"#2C2C2A"}}>{v}</span>
            </div>
          ))}
          <div style={{marginTop:8,display:"flex",alignItems:"center",gap:6}}>
            <div style={{flex:1,height:6,background:"#f0ede8",borderRadius:3,overflow:"hidden"}}>
              <div style={{width:`${pct}%`,height:"100%",background:pct===100?"#639922":"#EF9F27",borderRadius:3}}/>
            </div>
            <span style={{fontSize:10,color:"#888780"}}>{pct}%</span>
          </div>
          {willComplete && (
            <div style={{marginTop:8,background:"#EAF3DE",borderRadius:7,padding:"6px 10px",display:"flex",gap:6}}>
              <i className="ti ti-trophy" style={{color:"#3B6D11",fontSize:14,flexShrink:0}}/>
              <span style={{fontSize:11,color:"#27500A",fontWeight:500}}>This completes Book {book.bookNumber}! 🎉</span>
            </div>
          )}
        </div>
      )}

      {/* Mark as complete manually */}
      {!willComplete && stats.totalSold+tickets < book.ticketCount && (
        <div onClick={()=>setComplete(b=>!b)} style={{display:"flex",alignItems:"center",gap:8,background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"9px 12px",marginBottom:10,cursor:"pointer"}}>
          <div style={{width:18,height:18,borderRadius:5,border:`1.5px solid ${bookComplete?RED:"rgba(0,0,0,0.2)"}`,background:bookComplete?RED:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {bookComplete && <i className="ti ti-check" style={{color:GOLD,fontSize:12}}/>}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>Mark book as complete</div>
            <div style={{fontSize:10,color:"#888780"}}>Tick if remaining tickets returned / book closed</div>
          </div>
        </div>
      )}

      <SectionLabel>Payment mode</SectionLabel>
      <div style={{display:"flex",gap:6,marginBottom:10}}>
        {["cash","upi","bank"].map(mode=>(
          <div key={mode} onClick={()=>setMode(mode)} style={{flex:1,border:`0.5px solid ${paymentMode===mode?RED:"rgba(0,0,0,0.12)"}`,borderRadius:8,padding:"9px 4px",background:paymentMode===mode?"#FFF5F5":"#fff",textAlign:"center",fontSize:12,color:paymentMode===mode?RED:"#888780",fontWeight:paymentMode===mode?500:400,cursor:"pointer"}}>
            <i className={`ti ${paymentMode===mode?"ti-circle-check":"ti-circle"}`} style={{fontSize:13,marginRight:4}}/>{mode.toUpperCase()}
          </div>
        ))}
      </div>

      <InputField label="Remarks (optional)" value={remarks} onChange={setRemarks} placeholder="e.g. 2 tickets returned unsold..."/>
      <PrimaryButton onClick={submit} disabled={!tickets||tickets<=0||tickets>remaining}>
        <i className="ti ti-cash"/> Collect Cash
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

export default function BooksScreen() {
  const { data, addBook, addCollection, updateBook } = useApp();
  const [view, setView]           = useState("list");
  const [selectedBook, setBook]   = useState(null);
  const [filterSeries, setFS]     = useState("all");
  const [filterStatus, setFSt]    = useState("all");

  const filtered = data.books.filter(b=>{
    const sm = filterSeries==="all"||b.series===filterSeries||b.bookNumber?.startsWith(filterSeries);
    const st = filterStatus==="all"||b.status===filterStatus;
    return sm&&st;
  });

  const totalCollected = data.collections.reduce((s,c)=>s+(c.amount||0),0);
  const soldTickets    = data.collections.reduce((s,c)=>s+(c.ticketsSold||0),0);

  const Header = ({title,sub,onBack}) => (
    <div style={{background:RED,padding:"10px 14px 12px",display:"flex",alignItems:"center",gap:10}}>
      {onBack && <button onClick={onBack} style={{background:"none",border:"none",color:GOLD,fontSize:20,cursor:"pointer",padding:0}}><i className="ti ti-arrow-left"/></button>}
      <div><div style={{color:"#fff",fontSize:15,fontWeight:500}}>{title}</div>{sub&&<div style={{color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:2}}>{sub}</div>}</div>
    </div>
  );

  if (view==="assign") return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <Header title="Assign coupon book" sub="500 books · A/B/C series · Tickets 10001–20000" onBack={()=>setView("list")}/>
      <AssignBookForm onSave={b=>{addBook(b);setView("list");}} onCancel={()=>setView("list")}/>
    </div>
  );

  if (view==="collect" && selectedBook) return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <Header title="Collect Cash" sub={`Book ${selectedBook.bookNumber}`} onBack={()=>setView("list")}/>
      <CollectCashForm book={selectedBook} onSave={col=>{addCollection(col);setView("list");}} onCancel={()=>setView("list")}/>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,overflow:"hidden"}}>
      <div style={{background:RED,padding:"10px 14px 12px"}}>
        <div style={{color:"#fff",fontSize:15,fontWeight:500}}>Coupon books</div>
        <div style={{color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:2}}>500 books · 10,000 tickets (10001–20000) · ₹1,000 each</div>
      </div>
      <div style={{background:"#f7f4f0",flex:1,overflowY:"auto",padding:"10px 10px 4px"}}>

        {/* Grand totals */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
          {[{label:"Total collected",value:fmt(totalCollected),color:"#3B6D11"},{label:"Books assigned",value:`${data.books.length} / 500`,color:"#2C2C2A"},{label:"Tickets sold",value:`${soldTickets} / ${TOTAL_TICKETS}`,color:"#2C2C2A"},{label:"Pending",value:fmt(data.books.reduce((s,b)=>s+getBookStats(b,data.collections).pending,0)),color:"#854F0B"}].map((s,i)=>(
            <div key={i} style={{background:"#fff",borderRadius:8,border:"0.5px solid rgba(0,0,0,0.08)",padding:"8px 10px"}}>
              <div style={{fontSize:10,color:"#888780"}}>{s.label}</div>
              <div style={{fontSize:15,fontWeight:500,color:s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Series overview */}
        <SectionLabel>Series overview</SectionLabel>
        {getSeriesSummary(data.books,data.collections).map(s=>{
          const pct = Math.round((s.soldTickets/s.totalTickets)*100);
          return (
            <div key={s.key} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:7}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                <div style={{width:32,height:32,borderRadius:8,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:500,color:s.color,flexShrink:0}}>{s.key}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>{s.name} — {s.ticketsPerBook} tickets/book</div>
                  <div style={{fontSize:10,color:"#888780"}}>{s.totalBooks} books · Tickets {s.ticketStart}–{s.ticketEnd}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:500,color:"#3B6D11"}}>{fmt(s.collected)}</div>
                  <div style={{fontSize:10,color:"#888780"}}>{s.assignedBooks}/{s.totalBooks} assigned</div>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{flex:1,height:6,background:"#f0ede8",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:pct===100?"#639922":pct>50?"#EF9F27":"#E24B4A",borderRadius:3,transition:"width 0.4s"}}/>
                </div>
                <span style={{fontSize:10,color:"#888780"}}>{s.soldTickets}/{s.totalTickets}</span>
              </div>
            </div>
          );
        })}

        {/* Filters */}
        <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
          {["all","A","B","C"].map(s=>(
            <div key={s} onClick={()=>setFS(s)} style={{background:filterSeries===s?RED:"#fff",color:filterSeries===s?GOLD:"#5F5E5A",border:`0.5px solid ${filterSeries===s?RED:"rgba(0,0,0,0.12)"}`,borderRadius:14,padding:"4px 10px",fontSize:10,cursor:"pointer"}}>
              {s==="all"?"All series":`${s} series`}
            </div>
          ))}
          {[["all","All"],["not_started","Not started"],["ongoing","Ongoing"],["complete","Complete"]].map(([v,l])=>(
            <div key={v} onClick={()=>setFSt(v)} style={{background:filterStatus===v?"#2C2C2A":"#fff",color:filterStatus===v?"#fff":"#5F5E5A",border:`0.5px solid ${filterStatus===v?"#2C2C2A":"rgba(0,0,0,0.12)"}`,borderRadius:14,padding:"4px 10px",fontSize:10,cursor:"pointer"}}>
              {l}
            </div>
          ))}
        </div>

        <SectionLabel>Assigned books ({filtered.length})</SectionLabel>
        {filtered.length===0 && <div style={{textAlign:"center",color:"#888780",fontSize:12,padding:"20px 0"}}>No books in this filter</div>}

        {filtered.map(book=>{
          const stats  = getBookStats(book,data.collections);
          const member = data.members.find(m=>m.id===book.memberId);
          const pct    = Math.round((stats.totalSold/book.ticketCount)*100);
          const s      = getSeriesFromBook(book.bookNumber);
          const barC   = book.status==="complete"?"#639922":book.status==="ongoing"?"#EF9F27":"#E24B4A";
          return (
            <div key={book.id} style={{background:"#fff",borderRadius:10,border:"0.5px solid rgba(0,0,0,0.08)",padding:"10px 12px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:8,background:s?s.bg:"#f0ede8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:500,color:s?s.color:"#888",flexShrink:0}}>{book.bookNumber?.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:500,color:"#2C2C2A"}}>Book {book.bookNumber}</div>
                  <div style={{fontSize:10,color:"#888780",marginTop:1}}>{member?`${member.firstName} ${member.lastName}`:"—"} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
                </div>
                <StatusBadge status={book.status}/>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:5}}>
                <div style={{flex:1,height:6,background:"#f0ede8",borderRadius:3,overflow:"hidden"}}>
                  <div style={{width:`${pct}%`,height:"100%",background:barC,borderRadius:3}}/>
                </div>
                <span style={{fontSize:10,color:"#888780"}}>{stats.totalSold}/{book.ticketCount}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:book.status!=="complete"?8:0}}>
                <span style={{color:"#3B6D11",fontWeight:500}}>Collected: {fmt(stats.totalCollected)}</span>
                <span style={{color:stats.pending>0?"#854F0B":"#888780"}}>Pending: {fmt(stats.pending)}</span>
              </div>
              {book.status!=="complete" && (
                <button onClick={()=>{setBook(book);setView("collect");}} style={{width:"100%",background:RED,color:GOLD,border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <i className="ti ti-cash"/> Collect Cash
                </button>
              )}
            </div>
          );
        })}

        <button onClick={()=>setView("assign")} style={{width:"100%",background:"#fff",color:RED,border:`1px dashed ${RED}`,borderRadius:10,padding:11,fontSize:13,cursor:"pointer",marginBottom:8}}>
          <i className="ti ti-plus"/> Assign new book
        </button>
      </div>
    </div>
  );
}
