import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getBookStats, fmt } from "../data/store";
import { BOOK_SERIES, ALL_BOOKS, TICKET_PRICE, TOTAL_TICKETS, getSeriesFromBook, getSeriesSummary } from "../data/bookConfig";
import { Badge, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip, StatusBadge } from "../components/UI";

const GREEN = "#1a6b3c";

// ── Assign Book Form — supports multiple books per session ────
function AssignBookForm({ onSave, onCancel }) {
  const { data } = useApp();

  // Member
  const [memberId,       setMemberId]   = useState("");
  const [selectedSeries, setSeries]     = useState("");
  const [issueDate,      setIssueDate]  = useState(new Date().toISOString().split("T")[0]);
  const [notes,          setNotes]      = useState("");
  const [errors,         setErrors]     = useState({});

  // Books being assigned this session (array of bookNumbers)
  const [assignedBooks,  setAssigned]   = useState([]); // books added this session
  const [currentBook,    setCurrent]    = useState("");  // currently selected book in dropdown
  const [saved,          setSaved]      = useState(false); // final save done

  const member        = data.members.find(m => m.id === memberId);
  const series        = selectedSeries ? BOOK_SERIES[selectedSeries] : null;
  const alreadyInDB   = data.books.map(b => b.bookNumber);
  // Exclude both DB-assigned and session-assigned
  const takenNumbers  = [...alreadyInDB, ...assignedBooks];
  const available     = ALL_BOOKS.filter(b => b.series === selectedSeries && !takenNumbers.includes(b.bookNumber));
  const memberDBBooks = memberId ? data.books.filter(b => b.memberId === memberId) : [];

  // Add current book to session list
  function addBookToList() {
    if (!currentBook) return;
    if (assignedBooks.includes(currentBook)) return;
    setAssigned(prev => [...prev, currentBook]);
    setCurrent(""); // clear for next selection
  }

  function removeFromList(num) {
    setAssigned(prev => prev.filter(b => b !== num));
  }

  function validate() {
    const e = {};
    if (!memberId)              e.member = "Select a member";
    if (!selectedSeries)        e.series = "Select a series";
    if (assignedBooks.length === 0) e.books = "Add at least one book";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    // Save all books in the list
    assignedBooks.forEach(bookNum => {
      const bookDef = ALL_BOOKS.find(b => b.bookNumber === bookNum);
      if (!bookDef) return;
      onSave({
        bookNumber: bookNum,
        series:     selectedSeries,
        memberId,
        ticketCount: series.ticketsPerBook,
        ticketFrom:  bookDef.ticketFrom,
        ticketTo:    bookDef.ticketTo,
        issueDate,
        status:      "not_started",
        notes,
      });
    });
    setSaved(true);
  }

  // Success screen
  if (saved) return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, background:"#f5f7f5" }}>
      <div style={{ width:64, height:64, borderRadius:"50%", background:"#e8f5ee", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
        <i className="ti ti-circle-check" style={{ fontSize:36, color:GREEN }}/>
      </div>
      <div style={{ fontSize:17, fontWeight:700, color:"#1a1a1a", marginBottom:6 }}>
        {assignedBooks.length} book{assignedBooks.length > 1 ? "s" : ""} assigned!
      </div>
      <div style={{ fontSize:12, color:"#888", marginBottom:24, textAlign:"center" }}>
        To {member?.firstName} {member?.lastName}
      </div>
      {assignedBooks.map(num => {
        const bd = ALL_BOOKS.find(b => b.bookNumber === num);
        const s  = getSeriesFromBook(num);
        return (
          <div key={num} style={{ background:"#fff", borderRadius:9, border:"1px solid #eee", padding:"8px 12px", marginBottom:6, width:"100%", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:7, background:s?.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:s?.color, fontSize:13 }}>{num[0]}</div>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>Book {num}</div>
              <div style={{ fontSize:10, color:"#888" }}>Tickets {bd?.ticketFrom}–{bd?.ticketTo}</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:12, fontWeight:700, color:GREEN }}>{fmt(s?.ticketsPerBook * 1000)}</div>
          </div>
        );
      })}
      <button onClick={onCancel} style={{ width:"100%", marginTop:20, background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:11, padding:13, fontSize:13, fontWeight:700, cursor:"pointer" }}>
        Done
      </button>
    </div>
  );

  return (
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 12px 20px" }}>

      {/* STEP 1 — Member */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
          Step 1 — Select member
        </div>
        <select value={memberId} onChange={e => { setMemberId(e.target.value); setErrors(v => ({...v, member:""})); }}
          style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${errors.member?"#dc2626":memberId?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"10px 11px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box" }}>
          <option value="">— choose member —</option>
          {data.members.map(m => (
            <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {LABELS[m.label]?.label || m.label}</option>
          ))}
        </select>
        {errors.member && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{errors.member}</div>}

        {/* Member card */}
        {member && (
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:10, background:"#f8faf8", borderRadius:9, padding:"8px 10px" }}>
            <div style={{ width:34, height:34, borderRadius:9, background:LABELS[member.label]?.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:LABELS[member.label]?.color, flexShrink:0 }}>
              {(member.firstName[0]+member.lastName[0]).toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{member.firstName} {member.lastName}</div>
              <div style={{ display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                <Badge type={member.label}/>
                <span style={{ fontSize:10, color:"#aaa" }}>{memberDBBooks.length} books already assigned</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 2 — Series */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
          Step 2 — Select series
        </div>
        {errors.series && <div style={{ fontSize:10, color:"#dc2626", marginBottom:6 }}>{errors.series}</div>}
        <div style={{ display:"flex", gap:6 }}>
          {Object.entries(BOOK_SERIES).map(([key, s]) => {
            const rem = ALL_BOOKS.filter(b => b.series===key && !takenNumbers.includes(b.bookNumber)).length;
            return (
              <div key={key} onClick={() => { setSeries(key); setCurrent(""); setErrors(v=>({...v,series:""})); }}
                style={{ flex:1, border:`${selectedSeries===key?"2px":"1px"} solid ${selectedSeries===key?GREEN:"#e0e0e0"}`, borderRadius:10, padding:"10px 6px", background:selectedSeries===key?"#e8f5ee":"#fff", cursor:"pointer", textAlign:"center", transition:"all 0.15s" }}>
                <div style={{ width:30, height:30, borderRadius:8, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 5px", fontSize:15, fontWeight:700, color:s.color }}>{key}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#1a1a1a" }}>{s.ticketsPerBook} tickets</div>
                <div style={{ fontSize:9, color:"#aaa", marginTop:2 }}>{rem} left</div>
              </div>
            );
          })}
        </div>
        {series && (
          <div style={{ marginTop:8, background:series.bg, borderRadius:8, padding:"7px 10px" }}>
            <div style={{ fontSize:11, fontWeight:600, color:series.color }}>{series.name} · {series.label}</div>
            <div style={{ fontSize:10, color:series.color, opacity:0.8, marginTop:1 }}>Tickets {series.ticketStart}–{series.ticketEnd} · {available.length} books available</div>
          </div>
        )}
      </div>

      {/* STEP 3 — Select + Add books */}
      {series && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
            Step 3 — Add books
          </div>
          {errors.books && <div style={{ fontSize:10, color:"#dc2626", marginBottom:6 }}>{errors.books}</div>}

          {/* Book selector row */}
          <div style={{ display:"flex", gap:8, marginBottom:10 }}>
            <select value={currentBook} onChange={e => setCurrent(e.target.value)}
              style={{ flex:1, background:"#f8faf8", border:`1.5px solid ${currentBook?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"10px 11px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box" }}>
              <option value="">— select book number —</option>
              {available.slice(0, 200).map(b => (
                <option key={b.bookNumber} value={b.bookNumber}>
                  {b.bookNumber} (Tickets {b.ticketFrom}–{b.ticketTo})
                </option>
              ))}
            </select>
            <button onClick={addBookToList} disabled={!currentBook}
              style={{ background:currentBook?GREEN:"#e0e0e0", color:"#fff", border:"none", borderRadius:9, padding:"0 14px", fontSize:13, fontWeight:700, cursor:currentBook?"pointer":"not-allowed", display:"flex", alignItems:"center", gap:5, flexShrink:0, transition:"background 0.15s" }}>
              <i className="ti ti-plus" style={{ fontSize:16 }}/> Add
            </button>
          </div>

          {/* Ticket range preview for selected book */}
          {currentBook && (() => {
            const bd = ALL_BOOKS.find(b => b.bookNumber === currentBook);
            return bd ? (
              <div style={{ background:"#f8faf8", borderRadius:8, padding:"8px 10px", marginBottom:10, display:"flex", alignItems:"center", gap:10 }}>
                <i className="ti ti-lock" style={{ color:GREEN, fontSize:14, flexShrink:0 }}/>
                <div style={{ fontSize:11, color:"#555" }}>
                  Tickets <strong style={{ color:GREEN }}>{bd.ticketFrom}</strong> to <strong style={{ color:GREEN }}>{bd.ticketTo}</strong>
                  <span style={{ color:"#aaa", marginLeft:6 }}>({series.ticketsPerBook} tickets · auto-assigned)</span>
                </div>
              </div>
            ) : null;
          })()}

          {/* Added books list */}
          {assignedBooks.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:GREEN, marginBottom:6, display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-circle-check" style={{ fontSize:14 }}/> {assignedBooks.length} book{assignedBooks.length>1?"s":""} added
              </div>
              {assignedBooks.map(num => {
                const bd = ALL_BOOKS.find(b => b.bookNumber === num);
                const s  = getSeriesFromBook(num);
                return (
                  <div key={num} style={{ display:"flex", alignItems:"center", gap:8, background:"#e8f5ee", borderRadius:8, border:"1px solid #a5d6a7", padding:"8px 10px", marginBottom:6 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:s?.bg, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, color:s?.color, fontSize:12, flexShrink:0 }}>{num[0]}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>Book {num}</div>
                      <div style={{ fontSize:10, color:"#555" }}>Tickets {bd?.ticketFrom}–{bd?.ticketTo} · {fmt(series.ticketsPerBook * 1000)}</div>
                    </div>
                    <button onClick={() => removeFromList(num)}
                      style={{ background:"#ffebee", border:"1px solid #fca5a5", color:"#dc2626", borderRadius:7, padding:"4px 8px", fontSize:11, cursor:"pointer", flexShrink:0 }}>
                      <i className="ti ti-x" style={{ fontSize:12 }}/>
                    </button>
                  </div>
                );
              })}

              {/* Running total */}
              <div style={{ background:"#1a1a1a", borderRadius:8, padding:"9px 12px", marginTop:4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.65)" }}>{assignedBooks.length} book{assignedBooks.length>1?"s":""} · {assignedBooks.length * series.ticketsPerBook} tickets total</div>
                <div style={{ fontSize:14, fontWeight:700, color:"#fff" }}>{fmt(assignedBooks.length * series.ticketsPerBook * 1000)}</div>
              </div>
            </div>
          )}

          {available.length === 0 && assignedBooks.length === 0 && (
            <div style={{ textAlign:"center", padding:"12px 0", color:"#aaa", fontSize:12 }}>
              No more books available in {series.name}
            </div>
          )}
        </div>
      )}

      {/* STEP 4 — Date & notes */}
      {assignedBooks.length > 0 && (
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
            Step 4 — Issue details
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:5 }}>Issue date *</div>
            <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
              style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"10px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
          </div>
          <InputField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any instructions for this member..."/>
        </div>
      )}

      {/* Save button */}
      <PrimaryButton onClick={handleSave} disabled={assignedBooks.length === 0 || !memberId}>
        <i className="ti ti-ticket"/> Issue {assignedBooks.length > 0 ? `${assignedBooks.length} book${assignedBooks.length>1?"s":""}` : "books"}
        {member ? ` to ${member.firstName} ${member.lastName}` : ""}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Collect Cash Form ─────────────────────────────────────────
function CollectCashForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats    = getBookStats(book, data.collections);
  const member   = data.members.find(m => m.id === book.memberId);
  const series   = getSeriesFromBook(book.bookNumber);

  const [date,        setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setSold]     = useState("");
  const [paymentMode, setMode]     = useState("cash");
  const [remarks,     setRemarks]  = useState("");
  const [bookComplete,setComplete] = useState(false);

  const tickets    = parseInt(ticketsSold) || 0;
  const amount     = tickets * TICKET_PRICE;
  const remaining  = book.ticketCount - stats.totalSold;
  const newSold    = stats.totalSold + tickets;
  const newTotal   = stats.totalCollected + amount;
  const newPending = book.ticketCount * TICKET_PRICE - newTotal;
  const pct        = Math.round((newSold / book.ticketCount) * 100);
  const willComplete = newSold >= book.ticketCount;

  function submit() {
    if (!tickets || tickets <= 0 || tickets > remaining) return;
    onSave({ id:`C-${Date.now()}`, bookId:book.id, memberId:book.memberId, date, ticketsSold:tickets, amount, paymentMode, remarks, bookCompleted: willComplete || bookComplete });
  }

  return (
    <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 12px 20px" }}>

      {/* Book summary */}
      <div style={{ background: series ? series.bg : "#f0ede8", borderRadius:12, padding:"12px 14px", marginBottom:10, border:`1px solid ${series?.color}30` }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:"#1a1a1a" }}>Book {book.bookNumber}</div>
            <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{member?.firstName} {member?.lastName} · Issued {book.issueDate || "—"}</div>
            <div style={{ fontSize:11, color:"#888" }}>Tickets {book.ticketFrom}–{book.ticketTo}</div>
          </div>
          {series && <span style={{ fontSize:10, fontWeight:700, color:series.color, background:"#fff", padding:"3px 8px", borderRadius:7 }}>{series.label}</span>}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[["Total",book.ticketCount],["Sold",stats.totalSold],["Left",remaining]].map(([l,v])=>(
            <div key={l} style={{ background:"rgba(255,255,255,0.7)", borderRadius:7, padding:"6px 8px", textAlign:"center" }}>
              <div style={{ fontSize:9, color:"#888" }}>{l}</div>
              <div style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11 }}>
          <span style={{ color:GREEN, fontWeight:700 }}>Collected: {fmt(stats.totalCollected)}</span>
          <span style={{ color:"#e65100" }}>Pending: {fmt(stats.pending)}</span>
        </div>
      </div>

      <InfoChip>Amount = tickets × Rs.1,000. Max {remaining} tickets remaining.</InfoChip>

      <SectionLabel>Collection entry</SectionLabel>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:5 }}>Collection date *</div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{ width:"100%", background:"#fff", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"10px 11px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box" }}/>
      </div>

      <InputField label={`Tickets sold this time (max ${remaining})`} type="number" value={ticketsSold} onChange={setSold} required
        error={tickets > remaining ? `Cannot exceed ${remaining} remaining tickets` : ""}/>

      {/* Auto amount */}
      <div style={{ background:"#e8f5ee", borderRadius:10, padding:"12px 14px", marginBottom:10, border:"1px solid #a5d6a7" }}>
        <div style={{ fontSize:11, color:"#555", marginBottom:3 }}>Amount received (auto-calculated)</div>
        <div style={{ fontSize:30, fontWeight:700, color:GREEN }}>{fmt(amount)}</div>
        <div style={{ fontSize:11, color:"#888" }}>{tickets} tickets × Rs.1,000</div>
      </div>

      {/* After-entry preview */}
      {tickets > 0 && tickets <= remaining && (
        <div style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"10px 12px", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#1a1a1a", marginBottom:8 }}>After this entry</div>
          {[
            ["Tickets sold",    `${newSold} / ${book.ticketCount}`],
            ["Remaining",       `${book.ticketCount - newSold} left`,    book.ticketCount-newSold===0?GREEN:"#e65100"],
            ["Total collected", fmt(newTotal),                            GREEN],
            ["Balance",         fmt(Math.max(0,newPending)),              newPending<=0?GREEN:"#e65100"],
            ["Completion",      `${pct}%`],
          ].map(([l,v,c],i,arr)=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:i<arr.length-1?"1px solid #f5f5f5":"none", fontSize:11 }}>
              <span style={{ color:"#777" }}>{l}</span>
              <span style={{ fontWeight:700, color:c||"#1a1a1a" }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop:8, height:7, background:"#f0f0f0", borderRadius:4, overflow:"hidden" }}>
            <div style={{ width:`${pct}%`, height:"100%", background:pct===100?GREEN:"#4caf50", borderRadius:4, transition:"width 0.4s" }}/>
          </div>
          {willComplete && (
            <div style={{ marginTop:8, background:"#e8f5ee", borderRadius:8, padding:"7px 10px", display:"flex", gap:6 }}>
              <i className="ti ti-trophy" style={{ color:GREEN, fontSize:15, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:GREEN, fontWeight:700 }}>This completes Book {book.bookNumber}! 🎉</span>
            </div>
          )}
        </div>
      )}

      {/* Mark complete manually */}
      {!willComplete && remaining > 0 && (
        <div onClick={()=>setComplete(b=>!b)} style={{ display:"flex", alignItems:"center", gap:8, background:"#fff", borderRadius:9, border:"1px solid #eee", padding:"10px 12px", marginBottom:10, cursor:"pointer" }}>
          <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${bookComplete?GREEN:"#ccc"}`, background:bookComplete?GREEN:"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            {bookComplete && <i className="ti ti-check" style={{ color:"#fff", fontSize:11 }}/>}
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:"#1a1a1a" }}>Mark book as complete</div>
            <div style={{ fontSize:10, color:"#aaa" }}>Tick if remaining tickets returned or book closed</div>
          </div>
        </div>
      )}

      <SectionLabel>Payment mode</SectionLabel>
      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {["cash","upi","bank"].map(mode => (
          <div key={mode} onClick={()=>setMode(mode)}
            style={{ flex:1, border:`${paymentMode===mode?"2px":"1px"} solid ${paymentMode===mode?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"10px 4px", background:paymentMode===mode?"#e8f5ee":"#fff", textAlign:"center", fontSize:12, color:paymentMode===mode?GREEN:"#888", fontWeight:paymentMode===mode?700:400, cursor:"pointer", transition:"all 0.15s" }}>
            <i className={`ti ${mode==="cash"?"ti-cash":mode==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:16, display:"block", marginBottom:3 }}/>
            {mode.toUpperCase()}
          </div>
        ))}
      </div>

      <InputField label="Remarks (optional)" value={remarks} onChange={setRemarks} placeholder="e.g. 2 tickets returned unsold..."/>
      <PrimaryButton onClick={submit} disabled={!tickets || tickets<=0 || tickets>remaining}>
        <i className="ti ti-cash"/> Collect Cash
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Main Books Screen ─────────────────────────────────────────
export default function BooksScreen() {
  const { data, addBook, addCollection } = useApp();
  const [view,         setView]    = useState("list");
  const [selectedBook, setBook]    = useState(null);
  const [filterSeries, setFS]      = useState("all");
  const [filterStatus, setFSt]     = useState("all");

  const totalCollected = data.collections.reduce((s,c)=>s+(c.amount||0),0);
  const soldTickets    = data.collections.reduce((s,c)=>s+(c.ticketsSold||0),0);

  const filtered = data.books.filter(b => {
    const sm = filterSeries==="all" || b.series===filterSeries || b.bookNumber?.startsWith(filterSeries);
    const st = filterStatus==="all" || b.status===filterStatus;
    return sm && st;
  });

  const Header = ({ title, sub, onBack }) => (
    <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
      {onBack && <button onClick={onBack} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}><i className="ti ti-arrow-left"/></button>}
      <div>
        <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{title}</div>
        {sub && <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );

  if (view === "assign") return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <Header title="Assign coupon books" sub="Select member → series → add one or more books" onBack={()=>setView("list")}/>
      <AssignBookForm
        onSave={b => addBook(b)}
        onCancel={() => setView("list")}
      />
    </div>
  );

  if (view === "collect" && selectedBook) return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <Header title="Collect Cash" sub={`Book ${selectedBook.bookNumber}`} onBack={()=>setView("list")}/>
      <CollectCashForm book={selectedBook} onSave={col => { addCollection(col); setView("list"); }} onCancel={()=>setView("list")}/>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <div style={{ background:GREEN, padding:"10px 14px 12px" }}>
        <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Coupon books</div>
        <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>500 books · 10,000 tickets (10001–20000) · Rs.1,000 each</div>
      </div>

      <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"10px 12px 4px" }}>

        {/* ── ASSIGN BUTTON — TOP, always visible ── */}
        <button onClick={()=>setView("assign")}
          style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(26,107,60,0.25)" }}>
          <i className="ti ti-ticket" style={{ fontSize:18 }}/> Assign new book
        </button>

        {/* Grand totals */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:10 }}>
          {[
            { label:"Total collected", value:fmt(totalCollected),              color:GREEN },
            { label:"Books assigned",  value:`${data.books.length} / 500`,     color:"#1a1a1a" },
            { label:"Tickets sold",    value:`${soldTickets} / ${TOTAL_TICKETS}`,color:"#1a1a1a" },
            { label:"Pending",         value:fmt(data.books.reduce((s,b)=>s+getBookStats(b,data.collections).pending,0)), color:"#e65100" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:9, border:"1px solid #eee", padding:"8px 10px" }}>
              <div style={{ fontSize:10, color:"#aaa" }}>{s.label}</div>
              <div style={{ fontSize:15, fontWeight:700, color:s.color, marginTop:2 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Series overview */}
        <SectionLabel>Series overview</SectionLabel>
        {getSeriesSummary(data.books, data.collections).map(s => {
          const pct = Math.round((s.soldTickets / s.totalTickets) * 100);
          return (
            <div key={s.key} style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"10px 12px", marginBottom:7 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:s.color, flexShrink:0 }}>{s.key}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{s.name} — {s.ticketsPerBook} tickets/book</div>
                  <div style={{ fontSize:10, color:"#aaa" }}>{s.totalBooks} books · Tickets {s.ticketStart}–{s.ticketEnd}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:12, fontWeight:700, color:GREEN }}>{fmt(s.collected)}</div>
                  <div style={{ fontSize:10, color:"#aaa" }}>{s.assignedBooks}/{s.totalBooks} assigned</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ flex:1, height:6, background:"#f0f0f0", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:pct===100?GREEN:s.color, borderRadius:3, transition:"width 0.4s" }}/>
                </div>
                <span style={{ fontSize:10, color:"#aaa" }}>{s.soldTickets}/{s.totalTickets}</span>
              </div>
            </div>
          );
        })}

        {/* Filters */}
        <div style={{ display:"flex", gap:4, marginBottom:8, flexWrap:"wrap" }}>
          {["all","A","B","C"].map(s => (
            <div key={s} onClick={()=>setFS(s)}
              style={{ background:filterSeries===s?GREEN:"#fff", color:filterSeries===s?"#fff":"#666", border:`1px solid ${filterSeries===s?GREEN:"#e0e0e0"}`, borderRadius:14, padding:"4px 12px", fontSize:10, fontWeight:filterSeries===s?700:400, cursor:"pointer" }}>
              {s==="all"?"All series":`${s} series`}
            </div>
          ))}
          {[["all","All"],["not_started","Not started"],["ongoing","Ongoing"],["complete","Complete"]].map(([v,l]) => (
            <div key={v} onClick={()=>setFSt(v)}
              style={{ background:filterStatus===v?"#1a1a1a":"#fff", color:filterStatus===v?"#fff":"#666", border:`1px solid ${filterStatus===v?"#1a1a1a":"#e0e0e0"}`, borderRadius:14, padding:"4px 12px", fontSize:10, fontWeight:filterStatus===v?700:400, cursor:"pointer" }}>
              {l}
            </div>
          ))}
        </div>

        <SectionLabel>Assigned books ({filtered.length})</SectionLabel>
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", color:"#aaa", fontSize:12, padding:"30px 0" }}>
            No books in this filter
          </div>
        )}

        {filtered.map(book => {
          const stats  = getBookStats(book, data.collections);
          const member = data.members.find(m => m.id === book.memberId);
          const pct    = Math.round((stats.totalSold / book.ticketCount) * 100);
          const s      = getSeriesFromBook(book.bookNumber);
          const barC   = book.status==="complete"?GREEN:book.status==="ongoing"?"#4caf50":"#e53935";
          return (
            <div key={book.id} style={{ background:"#fff", borderRadius:11, border:"1px solid #eee", padding:"10px 12px", marginBottom:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:s?s.bg:"#f5f5f5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, fontWeight:700, color:s?s.color:"#aaa", flexShrink:0 }}>
                  {book.bookNumber?.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>Book {book.bookNumber}</div>
                  <div style={{ fontSize:10, color:"#aaa", marginTop:1 }}>
                    {member ? `${member.firstName} ${member.lastName}` : "—"} · Tickets {book.ticketFrom}–{book.ticketTo}
                  </div>
                </div>
                <StatusBadge status={book.status}/>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:5 }}>
                <div style={{ flex:1, height:6, background:"#f0f0f0", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:barC, borderRadius:3 }}/>
                </div>
                <span style={{ fontSize:10, color:"#aaa" }}>{stats.totalSold}/{book.ticketCount}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, marginBottom:book.status!=="complete"?8:0 }}>
                <span style={{ color:GREEN, fontWeight:700 }}>Collected: {fmt(stats.totalCollected)}</span>
                <span style={{ color:stats.pending>0?"#e65100":"#aaa" }}>Pending: {fmt(stats.pending)}</span>
              </div>
              {book.status !== "complete" && (
                <button onClick={()=>{ setBook(book); setView("collect"); }}
                  style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:8, padding:"9px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <i className="ti ti-cash"/> Collect Cash
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
