import { useState } from "react";
import { useApp } from "../data/AppContext";

const GREEN = "#1a6b3c";

export default function EditBookModal({ book, onClose }) {
  const { data, updateBook, showToast } = useApp();

  const currentMember = data.members.find(m => m.id===book.memberId || m.memberId===book.memberId);

  const [memberId,  setMemberId]  = useState(book.memberId || "");
  const [issueDate, setIssueDate] = useState(book.issueDate || "");
  const [notes,     setNotes]     = useState(book.notes || "");
  const [saving,    setSaving]    = useState(false);

  const newMember = data.members.find(m => m.id === memberId);
  const isReassigning = memberId && memberId !== book.memberId && currentMember;

  async function handleSave() {
    setSaving(true);
    await updateBook(book.id, { memberId, issueDate, notes });
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:"16px 16px 0 0", width:"100%", maxWidth:420, maxHeight:"90vh", overflowY:"auto", paddingBottom:24 }}>

        <div style={{ background:GREEN, padding:"12px 16px", borderRadius:"16px 16px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>Edit book {book.bookNumber}</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>Super admin only</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:7, width:28, height:28, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"12px 14px" }}>

          {/* Locked fields */}
          <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:7 }}>Fixed — cannot change</div>
          <div style={{ background:"#f5f7f5", borderRadius:10, border:"1px solid #eee", padding:"10px 12px", marginBottom:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[["Book number", book.bookNumber], ["Series", book.series||book.bookNumber?.[0]], ["Ticket range", `${book.ticketFrom}–${book.ticketTo}`], ["Total tickets", book.ticketCount]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:10, color:"#aaa", marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#888", display:"flex", alignItems:"center", gap:5 }}>
                    <i className="ti ti-lock" style={{ fontSize:11, color:"#ccc" }}/>{v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned member */}
          <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:7 }}>Editable</div>

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
              <i className="ti ti-alert-triangle" style={{ color:"#f57c00", fontSize:14, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:"#e65100", lineHeight:1.5 }}>
                Reassigning from <strong>{currentMember?.firstName} {currentMember?.lastName}</strong> to <strong>{newMember?.firstName} {newMember?.lastName}</strong>. Existing collection history stays linked to this book.
              </span>
            </div>
          )}

          {/* Issue date */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Issue date</div>
            <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)}
              style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* Notes */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Notes</div>
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes..."
              style={{ width:"100%", background:"#f8faf8", border:"1px solid #e0e0e0", borderRadius:9, padding:"9px 11px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
          </div>

          <button onClick={handleSave} disabled={saving}
            style={{ width:"100%", background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8 }}>
            <i className="ti ti-check" style={{ fontSize:15 }}/>{saving?"Saving...":"Save changes"}
          </button>

          <button onClick={onClose}
            style={{ width:"100%", background:"#fff", color:"#888", border:"1px solid #e0e0e0", borderRadius:10, padding:"11px", fontSize:12, cursor:"pointer" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
