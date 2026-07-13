import { useState } from "react";
import { useApp } from "../data/AppContext";
import { ALL_BOOKS, TICKET_GLOBAL_START, TICKET_GLOBAL_END, getSeriesFromBook } from "../data/bookConfig";
import { LABELS, fmt, initials } from "../data/store";

const GREEN = "#1a6b3c";
const MODE_ICONS  = { cash:"ti-cash", upi:"ti-device-mobile", bank:"ti-building-bank" };
const MODE_COLORS = { cash:"#1a6b3c", upi:"#1565c0", bank:"#7b4400" };
const MODE_BG     = { cash:"#e8f5ee", upi:"#e3f2fd", bank:"#fff3e0" };

export default function TicketLookup({ onClose }) {
  const { data } = useApp();
  const { books, collections, members } = data;

  const [input, setInput]   = useState("");
  const [result, setResult] = useState(null);
  const [error, setError]   = useState("");

  function lookup() {
    setError(""); setResult(null);
    const raw = input.trim();
    if (!raw) { setError("Enter a ticket number"); return; }

    const num = parseInt(raw, 10);
    if (isNaN(num)) { setError("Ticket number must be a number"); return; }
    if (num < TICKET_GLOBAL_START || num > TICKET_GLOBAL_END) {
      setError(`Ticket must be between ${TICKET_GLOBAL_START} and ${TICKET_GLOBAL_END}`);
      return;
    }

    // 1. Which book does this ticket belong to? (from master config)
    const bookDef = ALL_BOOKS.find(b => num >= b.ticketFrom && num <= b.ticketTo);
    if (!bookDef) { setError("Ticket not found in any book"); return; }

    // 2. Is that book actually issued/assigned in Firebase?
    const liveBook = books.find(b => b.bookNumber === bookDef.bookNumber);

    // 3. Who holds it, and who originally owned it?
    const holder = liveBook
      ? members.find(m => m.id === liveBook.memberId || m.memberId === liveBook.memberId)
      : null;
    const origOwner = liveBook?.originalMemberId && liveBook.originalMemberId !== liveBook.memberId
      ? members.find(m => m.id === liveBook.originalMemberId || m.memberId === liveBook.originalMemberId)
      : null;

    // 4. Has this exact ticket been sold? (common books track ticket-level buyers)
    let soldEntry = null, soldCol = null;
    if (liveBook) {
      for (const c of collections) {
        if (c.bookId !== liveBook.id) continue;
        const hit = (c.ticketEntries || []).find(e => parseInt(e.ticketNo, 10) === num);
        if (hit) { soldEntry = hit; soldCol = c; break; }
      }
    }

    // 5. Book-level sales (for regular books with no per-ticket entries)
    const bookCols  = liveBook ? collections.filter(c => c.bookId === liveBook.id) : [];
    const totalSold = bookCols.reduce((s,c)=>s+(c.ticketsSold||0),0);
    const totalColl = bookCols.reduce((s,c)=>s+(c.amount||0),0);
    const returned  = liveBook?.returnedTickets || 0;
    const effective = (liveBook?.ticketCount || bookDef.ticketCount) - returned;
    const pending   = Math.max(0, effective*1000 - totalColl);

    setResult({
      ticketNo: num, bookDef, liveBook, holder, origOwner,
      soldEntry, soldCol, totalSold, totalColl, effective, pending, returned,
      bookCols,
    });
  }

  function clear() { setInput(""); setResult(null); setError(""); }

  const sr = result ? getSeriesFromBook(result.bookDef.bookNumber) : null;

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      {/* Header */}
      <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        {onClose && (
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}>
            <i className="ti ti-arrow-left"/>
          </button>
        )}
        <div>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Ticket lookup</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>Search any ticket {TICKET_GLOBAL_START}–{TICKET_GLOBAL_END}</div>
        </div>
      </div>

      <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px 10px", minHeight:0 }}>

        {/* Search box */}
        <div style={{ display:"flex", gap:6, marginBottom:12 }}>
          <div style={{ flex:1, background:"#fff", borderRadius:9, border:`1.5px solid ${error?"#dc2626":"#e0e0e0"}`, display:"flex", alignItems:"center", padding:"0 10px", gap:6 }}>
            <i className="ti ti-ticket" style={{ color:"#aaa", fontSize:16 }}/>
            <input
              type="number"
              value={input}
              onChange={e=>{ setInput(e.target.value); setError(""); }}
              onKeyDown={e=>{ if(e.key==="Enter") lookup(); }}
              placeholder="e.g. 12055"
              style={{ flex:1, border:"none", outline:"none", fontSize:15, fontWeight:700, color:"#1a1a1a", background:"transparent", padding:"11px 0" }}/>
            {input && (
              <button onClick={clear} style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>
                <i className="ti ti-x" style={{ fontSize:14 }}/>
              </button>
            )}
          </div>
          <button onClick={lookup}
            style={{ background:GREEN, color:"#fff", border:"none", borderRadius:9, padding:"10px 16px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", gap:5 }}>
            <i className="ti ti-search" style={{ fontSize:15 }}/>Find
          </button>
        </div>

        {error && (
          <div style={{ background:"#ffebee", border:"1px solid #fca5a5", borderRadius:8, padding:"9px 11px", marginBottom:10, fontSize:11, color:"#c62828", display:"flex", gap:7 }}>
            <i className="ti ti-alert-circle" style={{ fontSize:14, flexShrink:0 }}/>{error}
          </div>
        )}

        {!result && !error && (
          <div style={{ textAlign:"center", color:"#bbb", padding:"40px 20px" }}>
            <i className="ti ti-ticket" style={{ fontSize:40, display:"block", marginBottom:10, opacity:0.4 }}/>
            <div style={{ fontSize:12 }}>Enter a ticket number to see which book it belongs to, who holds it, and whether it's sold.</div>
          </div>
        )}

        {result && (
          <>
            {/* Ticket header card */}
            <div style={{ background:sr?sr.bg:"#fff", borderRadius:12, border:`1.5px solid ${sr?sr.color:"#eee"}`, padding:"14px", marginBottom:10 }}>
              <div style={{ fontSize:10, color:sr?sr.color:"#888", fontWeight:600, marginBottom:3 }}>TICKET NUMBER</div>
              <div style={{ fontSize:30, fontWeight:700, color:sr?sr.color:"#1a1a1a", lineHeight:1 }}>{result.ticketNo}</div>
              <div style={{ fontSize:11, color:"#555", marginTop:6 }}>
                Book <strong>{result.bookDef.bookNumber}</strong> · {sr?.name} · Rs.1,000
              </div>
            </div>

            {/* SOLD status — the key answer */}
            {result.soldEntry ? (
              <div style={{ background:"#e8f5ee", border:"1.5px solid #a5d6a7", borderRadius:10, padding:"12px 13px", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:GREEN, marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
                  <i className="ti ti-circle-check" style={{ fontSize:14 }}/>SOLD
                </div>
                <Row label="Buyer" value={result.soldEntry.buyerName||"—"} bold/>
                <Row label="Amount" value={fmt(result.soldEntry.amount||1000)} color={GREEN} bold/>
                <Row label="Date" value={result.soldCol?.date||"—"}/>
                <Row label="Payment mode" value={(result.soldCol?.paymentMode||"cash").toUpperCase()}/>
                <Row label="Received by" value={result.soldCol?.paidTo==="treasurer"?"Treasurer (direct)":"Coordinator"}/>
                {result.soldCol?.paidTo==="treasurer" && (
                  <Row label="Verification" value={result.soldCol?.verifiedByCoordinator?"Verified":"Pending verify"}
                    color={result.soldCol?.verifiedByCoordinator?GREEN:"#f57c00"}/>
                )}
              </div>
            ) : !result.liveBook ? (
              <div style={{ background:"#f5f5f5", border:"1px solid #e0e0e0", borderRadius:10, padding:"12px 13px", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#888", marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
                  <i className="ti ti-package" style={{ fontSize:14 }}/>NOT ISSUED
                </div>
                <div style={{ fontSize:11, color:"#666", lineHeight:1.5 }}>
                  This ticket belongs to book <strong>{result.bookDef.bookNumber}</strong>, which hasn't been assigned to anyone yet. It's still in stock.
                </div>
              </div>
            ) : (
              <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:10, padding:"12px 13px", marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#e65100", marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
                  <i className="ti ti-clock" style={{ fontSize:14 }}/>NO BUYER RECORDED
                </div>
                <div style={{ fontSize:11, color:"#e65100", lineHeight:1.5 }}>
                  This book is issued, but no buyer name is recorded against this specific ticket.
                  {result.totalSold > 0
                    ? ` ${result.totalSold} of ${result.effective} tickets in this book have been sold (buyer names are only tracked per-ticket on common books).`
                    : " No tickets from this book have been sold yet."}
                </div>
              </div>
            )}

            {/* Book holder */}
            <SectionTitle>Book holder</SectionTitle>
            {result.liveBook ? (
              <div style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"11px 12px", marginBottom:10 }}>
                {result.liveBook.isCommon || !result.holder ? (
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:34,height:34,borderRadius:"50%",background:"#f3e5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#4a148c",flexShrink:0 }}>C</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>Common book</div>
                      <div style={{ fontSize:10, color:"#888" }}>Sold directly by the coordinator</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:8 }}>
                      <div style={{ width:34,height:34,borderRadius:"50%",background:LABELS[result.holder.label]?.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:LABELS[result.holder.label]?.color,flexShrink:0 }}>
                        {initials(result.holder)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>
                          {result.holder.firstName} {result.holder.lastName}
                          {result.origOwner && (
                            <span style={{ marginLeft:6, fontSize:9, fontWeight:600, background:"#e3f2fd", color:"#1565c0", padding:"1px 6px", borderRadius:4 }}>
                              from {result.origOwner.firstName}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize:10, color:"#888" }}>
                          {LABELS[result.holder.label]?.label}{result.holder.phone?` · ${result.holder.phone}`:""}
                        </div>
                      </div>
                    </div>
                    {result.origOwner && (
                      <div style={{ fontSize:10, color:"#1565c0", background:"#e3f2fd", borderRadius:6, padding:"5px 8px" }}>
                        <i className="ti ti-arrows-exchange" style={{ marginRight:4 }}/>
                        Originally issued to {result.origOwner.firstName} {result.origOwner.lastName}, handed over to the current holder.
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"11px 12px", marginBottom:10, fontSize:12, color:"#888" }}>
                Not assigned to anyone yet.
              </div>
            )}

            {/* Book progress */}
            <SectionTitle>Book {result.bookDef.bookNumber} — overall</SectionTitle>
            <div style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"11px 12px", marginBottom:10 }}>
              <Row label="Ticket range" value={`${result.bookDef.ticketFrom} – ${result.bookDef.ticketTo}`}/>
              <Row label="Tickets in book" value={result.bookDef.ticketCount}/>
              {result.liveBook && (
                <>
                  <Row label="Tickets sold" value={`${result.totalSold} / ${result.effective}`}/>
                  {result.returned > 0 && <Row label="Returned" value={result.returned} color="#e65100"/>}
                  <Row label="Collected" value={fmt(result.totalColl)} color={GREEN} bold/>
                  <Row label="Pending" value={fmt(result.pending)} color={result.pending>0?"#e65100":GREEN} bold/>
                  <Row label="Status" value={
                    result.liveBook.stoppedSelling ? "Stopped" :
                    result.liveBook.status==="complete" ? "Complete" :
                    result.totalSold>0 ? "Ongoing" : "Not started"
                  }/>
                  <Row label="Issued on" value={result.liveBook.issueDate||"—"}/>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 6px 2px" }}>
      {children}
    </div>
  );
}

function Row({ label, value, color="#1a1a1a", bold=false }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"4px 0", fontSize:12 }}>
      <span style={{ color:"#888" }}>{label}</span>
      <span style={{ color, fontWeight: bold ? 700 : 600 }}>{value}</span>
    </div>
  );
}
