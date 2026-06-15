import { useState } from "react";
import { useApp } from "../data/AppContext";
import { ALL_BOOKS, BOOK_SERIES, getSeriesFromBook } from "../data/bookConfig";

const GREEN = "#1a6b3c";

export default function EditBookModal({ book, onClose }) {
  const { data, updateBook, deleteBook, reassignBookRange, showToast } = useApp();

  const currentMember = data.members.find(m => m.id===book.memberId || m.memberId===book.memberId);
  const hasCollections = data.collections.some(c => c.bookId === book.id);

  const [mode,      setMode]      = useState("details"); // details | range | unassign
  const [memberId,  setMemberId]  = useState(book.memberId || "");
  const [issueDate, setIssueDate] = useState(book.issueDate || "");
  const [notes,     setNotes]     = useState(book.notes || "");
  const [newBookNo, setNewBookNo] = useState(book.bookNumber);
  const [saving,    setSaving]    = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Books already assigned (to prevent double-assign) — exclude current book
  const assignedNumbers = new Set(data.books.filter(b=>b.id!==book.id).map(b=>b.bookNumber));
  const newMember = data.members.find(m => m.id === memberId);
  const isReassigning = memberId && memberId !== book.memberId && currentMember;

  // For range change — the target book definition from master config
  const targetDef = ALL_BOOKS.find(b => b.bookNumber === newBookNo);
  const rangeChanged = newBookNo !== book.bookNumber;

  // ── Save plain details (member/date/notes) ──
  async function saveDetails() {
    setSaving(true);
    await updateBook(book.id, { memberId, issueDate, notes });
    setSaving(false);
    onClose();
  }

  // ── Change book number / ticket range (clears collections) ──
  async function saveRange() {
    if (!targetDef) { showToast("Invalid book number","error"); return; }
    if (assignedNumbers.has(newBookNo)) { showToast("That book is already assigned","error"); return; }
    setSaving(true);
    await reassignBookRange(book.id, {
      bookNumber: targetDef.bookNumber,
      series:     targetDef.series,
      ticketCount:targetDef.ticketCount,
      ticketFrom: targetDef.ticketFrom,
      ticketTo:   targetDef.ticketTo,
      memberId,
      issueDate,
      notes,
    });
    setSaving(false);
    onClose();
  }

  // ── Unassign / delete book entirely ──
  async function handleUnassign() {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      showToast("Type DELETE to confirm","error"); return;
    }
    setSaving(true);
    await deleteBook(book.id);
    setSaving(false);
    onClose();
  }

  const sr = getSeriesFromBook(book.bookNumber);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:"16px 16px 0 0", width:"100%", maxWidth:420, maxHeight:"92vh", overflowY:"auto", paddingBottom:24 }}>

        <div style={{ background:GREEN, padding:"12px 16px", borderRadius:"16px 16px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>Edit book {book.bookNumber}</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>Super admin only</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:7, width:28, height:28, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        {/* Mode tabs */}
        <div style={{ display:"flex", gap:5, padding:"10px 14px 0" }}>
          {[
            {k:"details", label:"Details", icon:"ti-user"},
            {k:"range",   label:"Book/Range", icon:"ti-ticket"},
            {k:"unassign",label:"Unassign", icon:"ti-trash"},
          ].map(t=>(
            <button key={t.k} onClick={()=>setMode(t.k)}
              style={{ flex:1, background:mode===t.k?GREEN:"#f0f0f0", color:mode===t.k?"#fff":"#666", border:"none", borderRadius:8, padding:"8px 4px", fontSize:11, fontWeight:700, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <i className={`ti ${t.icon}`} style={{ fontSize:15 }}/>{t.label}
            </button>
          ))}
        </div>

        <div style={{ padding:"12px 14px" }}>

          {/* Current book info */}
          <div style={{ background:"#f5f7f5", borderRadius:10, border:"1px solid #eee", padding:"10px 12px", marginBottom:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              {[["Current book", book.bookNumber], ["Series", sr?.name||book.series], ["Ticket range", `${book.ticketFrom}–${book.ticketTo}`], ["Total tickets", book.ticketCount]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:10, color:"#aaa", marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── DETAILS MODE ─── */}
          {mode==="details" && (
            <>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Assigned member</div>
                <select value={memberId} onChange={e=>setMemberId(e.target.value)}
                  style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${memberId?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 11px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box" }}>
                  <option value="">— Common book (no member) —</option>
                  {data.members.map(m=>(
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>

              {isReassigning && (
                <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:8, padding:"8px 10px", marginBottom:10, display:"flex", gap:7 }}>
                  <i className="ti ti-info-circle" style={{ color:"#f57c00", fontSize:14, flexShrink:0 }}/>
                  <span style={{ fontSize:11, color:"#e65100", lineHeight:1.5 }}>
                    Reassigning from <strong>{currentMember?.firstName} {currentMember?.lastName}</strong> to <strong>{newMember?.firstName} {newMember?.lastName}</strong>. Collections stay linked to this book.
                  </span>
                </div>
              )}

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Issue date</div>
                <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)}
                  style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Notes</div>
                <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes..."
                  style={{ width:"100%", background:"#f8faf8", border:"1px solid #e0e0e0", borderRadius:9, padding:"9px 11px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
              </div>

              <button onClick={saveDetails} disabled={saving}
                style={{ width:"100%", background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <i className="ti ti-check" style={{ fontSize:15 }}/>{saving?"Saving...":"Save details"}
              </button>
            </>
          )}

          {/* ─── RANGE MODE ─── */}
          {mode==="range" && (
            <>
              <div style={{ background:"#ffebee", border:"1px solid #fca5a5", borderRadius:8, padding:"9px 11px", marginBottom:12, display:"flex", gap:7 }}>
                <i className="ti ti-alert-triangle" style={{ color:"#c62828", fontSize:15, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:"#c62828", lineHeight:1.5 }}>
                  Changing the book number changes the ticket range. {hasCollections && <strong>All cash collected on this book will be deleted</strong>} so it starts fresh. This cannot be undone.
                </span>
              </div>

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>New book number</div>
                <select value={newBookNo} onChange={e=>setNewBookNo(e.target.value)}
                  style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${rangeChanged?"#c62828":GREEN}`, borderRadius:9, padding:"9px 11px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box" }}>
                  {ALL_BOOKS.map(b=>{
                    const taken = assignedNumbers.has(b.bookNumber);
                    return <option key={b.bookNumber} value={b.bookNumber} disabled={taken}>
                      {b.bookNumber} · {b.ticketFrom}–{b.ticketTo} ({b.ticketCount}t){taken?" — already assigned":""}
                    </option>;
                  })}
                </select>
              </div>

              {targetDef && rangeChanged && (
                <div style={{ background:"#e8f5ee", border:"1px solid #a5d6a7", borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
                  <div style={{ fontSize:10, color:"#2e7d32", marginBottom:4 }}>New assignment</div>
                  <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>{targetDef.bookNumber} · Tickets {targetDef.ticketFrom}–{targetDef.ticketTo}</div>
                  <div style={{ fontSize:11, color:"#555", marginTop:2 }}>{targetDef.ticketCount} tickets × Rs.1,000 = Rs.{(targetDef.ticketCount*1000).toLocaleString()}</div>
                </div>
              )}

              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Assigned member</div>
                <select value={memberId} onChange={e=>setMemberId(e.target.value)}
                  style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${memberId?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 11px", fontSize:13, color:"#1a1a1a", outline:"none", boxSizing:"border-box" }}>
                  <option value="">— Common book (no member) —</option>
                  {data.members.map(m=>(
                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                  ))}
                </select>
              </div>

              <button onClick={saveRange} disabled={saving||!rangeChanged}
                style={{ width:"100%", background:(saving||!rangeChanged)?"#ccc":"linear-gradient(135deg,#c62828,#8b0000)", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:(saving||!rangeChanged)?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <i className="ti ti-refresh" style={{ fontSize:15 }}/>
                {!rangeChanged ? "Select a different book" : saving ? "Saving..." : "Change book & clear collections"}
              </button>
            </>
          )}

          {/* ─── UNASSIGN MODE ─── */}
          {mode==="unassign" && (
            <>
              <div style={{ background:"#ffebee", border:"1px solid #fca5a5", borderRadius:8, padding:"10px 12px", marginBottom:12 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#c62828", marginBottom:5 }}>
                  <i className="ti ti-alert-triangle" style={{ marginRight:5 }}/>Unassign this book completely
                </div>
                <div style={{ fontSize:11, color:"#c62828", lineHeight:1.5 }}>
                  This removes book <strong>{book.bookNumber}</strong> from {currentMember?`${currentMember.firstName} ${currentMember.lastName}`:"the common pool"}{hasCollections && <> and <strong>deletes all cash collected on it</strong></>}. The book becomes available to assign again. This cannot be undone.
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Type <strong>DELETE</strong> to confirm</div>
                <input value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder="DELETE"
                  style={{ width:"100%", background:"#fff5f5", border:`1.5px solid ${confirmText.trim().toUpperCase()==="DELETE"?"#c62828":"#e0e0e0"}`, borderRadius:9, padding:"10px 11px", fontSize:14, fontWeight:700, color:"#c62828", outline:"none", boxSizing:"border-box", letterSpacing:1 }}/>
              </div>

              <button onClick={handleUnassign} disabled={saving||confirmText.trim().toUpperCase()!=="DELETE"}
                style={{ width:"100%", background:(saving||confirmText.trim().toUpperCase()!=="DELETE")?"#ccc":"linear-gradient(135deg,#c62828,#8b0000)", color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:(saving||confirmText.trim().toUpperCase()!=="DELETE")?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <i className="ti ti-trash" style={{ fontSize:15 }}/>{saving?"Removing...":"Unassign book permanently"}
              </button>
            </>
          )}

          <button onClick={onClose}
            style={{ width:"100%", background:"#fff", color:"#888", border:"1px solid #e0e0e0", borderRadius:10, padding:"11px", fontSize:12, cursor:"pointer", marginTop:8 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
