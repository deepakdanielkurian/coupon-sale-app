import { useState } from "react";
import { useApp } from "../data/AppContext";
import { fmt, initials, LABELS } from "../data/store";

const GREEN  = "#1a6b3c";
const PURPLE = "#4a148c";

export default function ShareholdersScreen({ onBack }) {
  const { data, addShareholder, updateShareholder, deleteShareholder, can, showToast } = useApp();
  const { shareholders = [], members = [] } = data;

  const [view,    setView]    = useState("list");   // list | form
  const [editing, setEditing] = useState(null);
  const [search,  setSearch]  = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const canManage = can.manageShareholders ? can.manageShareholders() : true;

  const filtered = shareholders.filter(s => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (s.name||"").toLowerCase().includes(q) || (s.fromName||"").toLowerCase().includes(q);
  });

  // Display-only totals (kept separate from all accounting)
  const totalTickets = shareholders.reduce((sum,s)=>sum+(parseInt(s.tickets)||0),0);
  const totalAmount  = shareholders.reduce((sum,s)=>sum+(parseInt(s.amount)||0),0);

  async function handleDelete(id) {
    if (confirmDel !== id) { setConfirmDel(id); return; }
    await deleteShareholder(id);
    setConfirmDel(null);
  }

  if (view === "form") {
    return <ShareholderForm
      existing={editing}
      members={members}
      shareholders={shareholders}
      onCancel={()=>{ setView("list"); setEditing(null); }}
      onSave={async form=>{
        if (editing) await updateShareholder(editing.id, form);
        else         await addShareholder(form);
        setView("list"); setEditing(null);
      }}
    />;
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

      {/* Header */}
      <div style={{ background:PURPLE, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        {onBack && (
          <button onClick={onBack} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}>
            <i className="ti ti-arrow-left"/>
          </button>
        )}
        <div style={{ flex:1 }}>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Ticket Supporters</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>Display-only list · not part of accounts</div>
        </div>
      </div>

      <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"10px 12px 14px", minHeight:0 }}>

        {/* Explanation */}
        <div style={{ background:"#f3e5f5", border:"1px solid #e1bee7", borderRadius:9, padding:"9px 11px", marginBottom:10, display:"flex", gap:7 }}>
          <i className="ti ti-info-circle" style={{ color:PURPLE, fontSize:15, flexShrink:0 }}/>
          <div style={{ fontSize:10, color:PURPLE, lineHeight:1.5 }}>
            Names recorded here are <strong>for display only</strong>. They appear as a separate section in the Summary Report and are never added to collections, balances, or any accounting total.
          </div>
        </div>

        {/* Totals (display only) */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
          {[
            ["Holders", shareholders.length],
            ["Tickets", totalTickets],
            ["Amount",  fmt(totalAmount)],
          ].map(([l,v])=>(
            <div key={l} style={{ background:"#fff", borderRadius:9, border:"1px solid #eee", padding:"8px 9px" }}>
              <div style={{ fontSize:9, color:"#aaa" }}>{l}</div>
              <div style={{ fontSize:14, fontWeight:700, color:PURPLE }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Add button */}
        {canManage && (
          <button onClick={()=>{ setEditing(null); setView("form"); }}
            style={{ width:"100%", background:`linear-gradient(135deg,${PURPLE},#6a1b9a)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:10 }}>
            <i className="ti ti-user-plus" style={{ fontSize:16 }}/>Add Ticket Supporter
          </button>
        )}

        {/* Search */}
        {shareholders.length > 0 && (
          <div style={{ background:"#fff", borderRadius:9, border:"1px solid #e0e0e0", display:"flex", alignItems:"center", padding:"0 10px", gap:6, marginBottom:10 }}>
            <i className="ti ti-search" style={{ color:"#ccc", fontSize:15 }}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or seller..."
              style={{ flex:1, border:"none", outline:"none", fontSize:12, padding:"10px 0", background:"transparent" }}/>
            {search && <button onClick={()=>setSearch("")} style={{ background:"none",border:"none",cursor:"pointer",color:"#aaa" }}><i className="ti ti-x" style={{ fontSize:13 }}/></button>}
          </div>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", color:"#bbb", padding:"36px 20px" }}>
            <i className="ti ti-users" style={{ fontSize:38, display:"block", marginBottom:9, opacity:0.4 }}/>
            <div style={{ fontSize:12 }}>
              {shareholders.length===0 ? "No Ticket Supporters added yet." : `No match for "${search}"`}
            </div>
          </div>
        ) : filtered.map(s => (
          <div key={s.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #eee", padding:"11px 12px", marginBottom:7 }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}>
              <div style={{ width:34, height:34, borderRadius:"50%", background:"#f3e5f5", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:PURPLE, flexShrink:0 }}>
                {initials({ firstName:s.name, lastName:"" })}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{s.name}</div>
                <div style={{ fontSize:10, color:"#888", marginTop:1 }}>
                  {s.tickets} ticket{s.tickets!=1?"s":""}
                  {s.fromName ? <> · from <strong style={{ color:"#555" }}>{s.fromName}</strong></> : null}
                  {s.date ? ` · ${s.date}` : ""}
                </div>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:PURPLE, flexShrink:0 }}>{fmt(parseInt(s.amount)||0)}</div>
            </div>

            {s.notes && (
              <div style={{ fontSize:10, color:"#888", marginTop:6, paddingTop:6, borderTop:"1px solid #f5f5f5", fontStyle:"italic" }}>{s.notes}</div>
            )}

            {canManage && (
              <div style={{ display:"flex", gap:6, marginTop:8, justifyContent:"flex-end" }}>
                <button onClick={()=>{ setEditing(s); setView("form"); }}
                  style={{ background:"#f0f9f4", border:"1px solid #a5d6a7", color:GREEN, borderRadius:7, padding:"4px 10px", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                  <i className="ti ti-edit" style={{ fontSize:11, marginRight:3 }}/>Edit
                </button>
                <button onClick={()=>handleDelete(s.id)}
                  style={{ background:confirmDel===s.id?"#c62828":"#fff", border:"1px solid #fca5a5", color:confirmDel===s.id?"#fff":"#c62828", borderRadius:7, padding:"4px 10px", fontSize:10, fontWeight:700, cursor:"pointer" }}>
                  <i className="ti ti-trash" style={{ fontSize:11, marginRight:3 }}/>{confirmDel===s.id?"Confirm?":"Delete"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function ShareholderForm({ existing, members, shareholders=[], onSave, onCancel }) {
  const [name,     setName]     = useState(existing?.name || "");
  const [tickets,  setTickets]  = useState(existing?.tickets ? String(existing.tickets) : "");
  const [amount,   setAmount]   = useState(existing?.amount ? String(existing.amount) : "");
  const [fromName, setFromName] = useState(existing?.fromName || "");
  const [date,     setDate]     = useState(existing?.date || new Date().toISOString().split("T")[0]);
  const [notes,    setNotes]    = useState(existing?.notes || "");
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const [showNameSug, setShowNameSug]   = useState(false);
  const [showFromSug, setShowFromSug]   = useState(false);

  // Unique already-entered supporter names (for autocomplete, avoid repetition)
  const pastNames = [...new Set(shareholders.map(s=>(s.name||"").trim()).filter(Boolean))];
  const nameSug = name.trim()
    ? pastNames.filter(n => n.toLowerCase().includes(name.trim().toLowerCase()) && n.toLowerCase()!==name.trim().toLowerCase()).slice(0,6)
    : [];

  // Seller suggestions = members + any past "fromName" values, matched loosely by any word
  const sellerPool = [...new Set([
    ...members.map(m=>`${m.firstName} ${m.lastName}`.trim()),
    ...shareholders.map(s=>(s.fromName||"").trim()),
  ].filter(Boolean))];
  const fromSug = fromName.trim()
    ? sellerPool.filter(n => n.toLowerCase().includes(fromName.trim().toLowerCase()) && n.toLowerCase()!==fromName.trim().toLowerCase()).slice(0,6)
    : [];

  const t = parseInt(tickets) || 0;

  // Auto-suggest amount from ticket count, but let the user override
  function onTicketsChange(v) {
    setTickets(v);
    setErrors(e=>({...e,tickets:""}));
    const n = parseInt(v);
    if (!isNaN(n) && (!amount || amount === String((parseInt(tickets)||0)*1000))) {
      setAmount(String(n*1000));
    }
  }

  function validate() {
    const e = {};
    if (!name.trim())            e.name    = "Enter the supporter's name";
    if (!tickets || t <= 0)      e.tickets = "Enter ticket count";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSaving(true);
    await onSave({
      name:     name.trim(),
      tickets:  t,
      amount:   parseInt(amount) || 0,
      fromName: fromName.trim(),
      date,
      notes:    notes.trim(),
    });
    setSaving(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <div style={{ background:PURPLE, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
        <button onClick={onCancel} style={{ background:"none", border:"none", color:"#fff", fontSize:20, cursor:"pointer", padding:0 }}>
          <i className="ti ti-arrow-left"/>
        </button>
        <div>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{existing ? "Edit" : "Add"} Ticket Supporter</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>For display only · not counted in accounts</div>
        </div>
      </div>

      <div style={{ background:"#f5f7f5", flex:1, overflowY:"auto", padding:"12px", minHeight:0 }}>

        {/* Name — with autocomplete from already-entered supporters */}
        <Field label="Supporter name *" error={errors.name}>
          <div style={{ position:"relative" }}>
            <input value={name}
              onChange={e=>{ setName(e.target.value); setErrors(v=>({...v,name:""})); setShowNameSug(true); }}
              onFocus={()=>setShowNameSug(true)}
              onBlur={()=>setTimeout(()=>setShowNameSug(false),150)}
              placeholder="Start typing the supporter's name..."
              style={inp(errors.name, name)}/>
            {showNameSug && nameSug.length>0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:20, marginTop:3, maxHeight:180, overflowY:"auto", border:"1px solid #e1bee7", borderRadius:8, background:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize:9, color:"#aaa", padding:"5px 10px 3px" }}>Already entered — tap to reuse</div>
                {nameSug.map(n=>(
                  <div key={n} onMouseDown={()=>{ setName(n); setShowNameSug(false); }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderTop:"0.5px solid #f5f5f5", cursor:"pointer" }}>
                    <i className="ti ti-user" style={{ fontSize:13, color:PURPLE }}/>
                    <span style={{ fontSize:12, color:"#1a1a1a" }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* Tickets */}
        <Field label="How many tickets *" error={errors.tickets}>
          <input type="number" value={tickets} onChange={e=>onTicketsChange(e.target.value)} min="1"
            placeholder="e.g. 10"
            style={{ ...inp(errors.tickets, tickets), fontSize:15, fontWeight:700, color:PURPLE }}/>
        </Field>

        {/* Amount */}
        <Field label="Total amount">
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
            placeholder="0"
            style={{ ...inp("", amount), fontSize:15, fontWeight:700, color:PURPLE }}/>
          <div style={{ fontSize:9, color:"#aaa", marginTop:3 }}>
            Auto-filled as tickets × Rs.1,000 — edit if the actual amount differs.
          </div>
        </Field>

        {/* Took tickets from — search as you type (members + past sellers) */}
        <Field label="Took tickets from">
          <div style={{ position:"relative" }}>
            <input value={fromName}
              onChange={e=>{ setFromName(e.target.value); setShowFromSug(true); }}
              onFocus={()=>setShowFromSug(true)}
              onBlur={()=>setTimeout(()=>setShowFromSug(false),150)}
              placeholder="Type seller name to search..."
              style={inp("", fromName)}/>
            {showFromSug && fromSug.length>0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, zIndex:20, marginTop:3, maxHeight:200, overflowY:"auto", border:"1px solid #e0e0e0", borderRadius:8, background:"#fff", boxShadow:"0 4px 12px rgba(0,0,0,0.08)" }}>
                {fromSug.map(n=>(
                  <div key={n} onMouseDown={()=>{ setFromName(n); setShowFromSug(false); }}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderTop:"0.5px solid #f5f5f5", cursor:"pointer" }}>
                    <i className="ti ti-user-check" style={{ fontSize:13, color:GREEN }}/>
                    <span style={{ fontSize:12, color:"#1a1a1a" }}>{n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Field>

        {/* Date */}
        <Field label="Date">
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp("", date)}/>
        </Field>

        {/* Notes */}
        <Field label="Notes (optional)">
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any remark..." style={inp("", notes)}/>
        </Field>

        {/* Preview */}
        {name.trim() && t > 0 && (
          <div style={{ background:"#f3e5f5", border:"1px solid #e1bee7", borderRadius:9, padding:"10px 12px", marginBottom:12 }}>
            <div style={{ fontSize:9, color:PURPLE, marginBottom:3 }}>WILL APPEAR IN REPORT AS</div>
            <div style={{ fontSize:12, fontWeight:700, color:PURPLE }}>
              {name.trim()} — {t} ticket{t!=1?"s":""}{fromName.trim()?` (from ${fromName.trim()})`:""} — {fmt(parseInt(amount)||0)}
            </div>
          </div>
        )}

        <button onClick={handleSubmit} disabled={saving}
          style={{ width:"100%", background:saving?"#ccc":`linear-gradient(135deg,${PURPLE},#6a1b9a)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:8 }}>
          <i className="ti ti-check" style={{ fontSize:15 }}/>{saving ? "Saving..." : existing ? "Save changes" : "Add Ticket Supporter"}
        </button>
        <button onClick={onCancel}
          style={{ width:"100%", background:"#fff", color:"#888", border:"1px solid #e0e0e0", borderRadius:10, padding:"11px", fontSize:12, cursor:"pointer" }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:11 }}>
      <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>{label}</div>
      {children}
      {error && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>{error}</div>}
    </div>
  );
}

function inp(error, value) {
  return {
    width:"100%", background:"#fff",
    border:`1.5px solid ${error ? "#dc2626" : value ? PURPLE : "#e0e0e0"}`,
    borderRadius:9, padding:"10px 11px", fontSize:13, color:"#1a1a1a",
    outline:"none", boxSizing:"border-box",
  };
}
