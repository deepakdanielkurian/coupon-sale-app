import { useState } from "react";
import { useApp } from "../data/AppContext";
import { fmt } from "../data/store";

const GREEN = "#1a6b3c";
const MODE_ICONS = { cash:"ti-cash", upi:"ti-device-mobile", bank:"ti-building-bank" };

export default function EditCollectionModal({ col, book, onClose }) {
  const { updateCollection, deleteCollection, showToast } = useApp();

  const [date,      setDate]    = useState(col.date || "");
  const [tickets,   setTickets] = useState(String(col.ticketsSold || ""));
  const [payMode,   setPayMode] = useState(col.paymentMode || "cash");
  const [paidTo,    setPaidTo]  = useState(col.paidTo || "coordinator");
  const [remarks,   setRemarks] = useState(col.remarks || "");
  const [saving,    setSaving]  = useState(false);
  const [confirming,setConfirming] = useState(false);

  const t      = parseInt(tickets) || 0;
  const amount = t * 1000;
  const isDirect = paidTo === "treasurer";

  async function handleSave() {
    if (!date || t <= 0) { showToast("Enter valid date and tickets","error"); return; }
    setSaving(true);
    await updateCollection(col.id, {
      date, ticketsSold: t, amount,
      paymentMode: payMode, paidTo,
      verifiedByCoordinator: paidTo === "coordinator" ? true : col.verifiedByCoordinator,
      remarks,
      bookId: col.bookId, memberId: col.memberId,
    });
    setSaving(false);
    onClose();
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return; }
    setSaving(true);
    await deleteCollection(col.id);
    setSaving(false);
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
      <div style={{ background:"var(--color-background-primary,#fff)", borderRadius:"16px 16px 0 0", width:"100%", maxWidth:420, maxHeight:"90vh", overflowY:"auto", paddingBottom:20 }}>

        {/* Header */}
        <div style={{ background:GREEN, padding:"12px 16px", borderRadius:"16px 16px 0 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ color:"#fff", fontSize:14, fontWeight:700 }}>Edit collection entry</div>
            <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>Super admin only</div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:7, width:28, height:28, cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>

        <div style={{ padding:"12px 14px" }}>

          {/* Book info strip */}
          {book && (
            <div style={{ background:"#f5f7f5", borderRadius:9, padding:"8px 11px", marginBottom:12, display:"flex", justifyContent:"space-between", fontSize:11 }}>
              <span style={{ color:"#888" }}>Book {book.bookNumber} · Tickets {book.ticketFrom}–{book.ticketTo}</span>
              <span style={{ color:GREEN, fontWeight:700 }}>Originally {fmt(col.amount)}</span>
            </div>
          )}

          {/* Date */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Date *</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* Tickets */}
          <div style={{ marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Tickets sold *</div>
            <input type="number" value={tickets} onChange={e=>setTickets(e.target.value)} min="1"
              style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${t>0?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 11px", fontSize:14, fontWeight:700, color:GREEN, outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* Amount auto */}
          <div style={{ background:"#e8f5ee", border:"1px solid #a5d6a7", borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:10, color:"#2e7d32", marginBottom:2 }}>Amount (auto-calculated)</div>
            <div style={{ fontSize:24, fontWeight:700, color:GREEN }}>{fmt(amount)}</div>
            <div style={{ fontSize:10, color:"#555" }}>{t} × Rs.1,000</div>
          </div>

          {/* Received by */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:6 }}>Received by</div>
            {[
              {key:"coordinator", label:"Coordinator (me)",   sub:"Cash or UPI to you",         badge:"In hand",     badgeBg:"#e8f5ee", badgeC:GREEN},
              {key:"treasurer",   label:"Treasurer directly", sub:"Member paid treasurer",        badge:"Verify later",badgeBg:"#fff8e1", badgeC:"#f57c00"},
            ].map(opt=>{
              const sel=paidTo===opt.key, bc=opt.key==="treasurer"?"#e65100":GREEN;
              return(
                <div key={opt.key} onClick={()=>setPaidTo(opt.key)}
                  style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,border:`${sel?"1.5px":"1px"} solid ${sel?bc:"#e0e0e0"}`,background:sel?opt.key==="treasurer"?"#fff8e1":"#f0f9f4":"#fff",marginBottom:5,cursor:"pointer" }}>
                  <div style={{ width:16,height:16,borderRadius:"50%",border:`2px solid ${sel?bc:"#ccc"}`,background:sel?bc:"transparent",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                    {sel&&<div style={{ width:5,height:5,borderRadius:"50%",background:"#fff" }}/>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:sel?bc:"#1a1a1a" }}>{opt.label}</div>
                    <div style={{ fontSize:10,color:"#888" }}>{opt.sub}</div>
                  </div>
                  <span style={{ fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:6,background:opt.badgeBg,color:opt.badgeC }}>{opt.badge}</span>
                </div>
              );
            })}
          </div>

          {/* Payment mode */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:6 }}>Payment mode</div>
            <div style={{ display:"flex", gap:6 }}>
              {["cash","upi","bank"].map(m=>(
                <div key={m} onClick={()=>setPayMode(m)}
                  style={{ flex:1,border:`${payMode===m?"2px":"1px"} solid ${payMode===m?isDirect?"#e65100":GREEN:"#e0e0e0"}`,borderRadius:9,padding:"9px 4px",background:payMode===m?isDirect?"#fff8e1":"#e8f5ee":"#fff",textAlign:"center",fontSize:12,color:payMode===m?isDirect?"#e65100":GREEN:"#888",fontWeight:payMode===m?700:400,cursor:"pointer" }}>
                  <i className={`ti ${MODE_ICONS[m]}`} style={{ fontSize:15,display:"block",marginBottom:3 }}/>
                  {m.toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Remarks */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Remarks (optional)</div>
            <input value={remarks} onChange={e=>setRemarks(e.target.value)} placeholder="Any note..."
              style={{ width:"100%", background:"#f8faf8", border:"1px solid #e0e0e0", borderRadius:9, padding:"9px 11px", fontSize:12, outline:"none", boxSizing:"border-box" }}/>
          </div>

          {/* Warning */}
          <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:8, padding:"8px 10px", marginBottom:14, display:"flex", gap:7 }}>
            <i className="ti ti-alert-triangle" style={{ color:"#f57c00", fontSize:14, flexShrink:0 }}/>
            <span style={{ fontSize:11, color:"#e65100", lineHeight:1.5 }}>
              Editing tickets or amount updates book status and coordinator balance automatically.
            </span>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            style={{ width:"100%", background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8 }}>
            <i className="ti ti-check" style={{ fontSize:15 }}/>{saving?"Saving...":"Save changes"}
          </button>

          {/* Delete */}
          <button onClick={handleDelete} disabled={saving}
            style={{ width:"100%", background:confirming?"#dc2626":"#fff", color:confirming?"#fff":"#dc2626", border:`1.5px solid ${confirming?"#dc2626":"#fca5a5"}`, borderRadius:10, padding:"11px", fontSize:12, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8, transition:"all 0.2s" }}>
            <i className="ti ti-trash" style={{ fontSize:13 }}/>
            {confirming ? "Tap again to confirm delete" : "Delete this entry"}
          </button>

          {confirming && (
            <button onClick={()=>setConfirming(false)}
              style={{ width:"100%", background:"#fff", color:"#888", border:"1px solid #e0e0e0", borderRadius:10, padding:"10px", fontSize:12, cursor:"pointer" }}>
              Cancel delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
