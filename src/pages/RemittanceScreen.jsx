import { useState } from "react";
import { useApp } from "../data/AppContext";
import { fmt } from "../data/store";

const GREEN = "#1a6b3c";

export default function RemittanceScreen({ onBack }) {
  const { data, addRemittance, verifyDirectPayment, showToast, can } = useApp();
  const { remittances=[], collections, members, books } = data;

  const [showForm, setShowForm] = useState(false);
  const [date,     setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [amount,   setAmount]   = useState("");
  const [toWhom,   setToWhom]   = useState("Treasurer");
  const [payMode,  setPayMode]  = useState("cash");
  const [notes,    setNotes]    = useState("");
  const [saving,   setSaving]   = useState(false);
  const [verifying,setVerifying]= useState(null);

  // ── Last remittance cutoff ──────────────────────────────────
  // Option A: only show collections SINCE the last remittance
  const lastRemittance = remittances.length > 0 ? remittances[0] : null;
  const lastRemitDate  = lastRemittance?.date || null;
  // Filter collections that came in AFTER the last remittance date
  // If no remittance yet, show everything
  const freshCols = collections.filter(c => {
    if (!lastRemitDate) return true;
    return c.date >= lastRemitDate; // same day or after counts as fresh
  });

  // ── Fresh cycle calculations (since last remittance) ────────
  const freshToCoord   = freshCols.filter(c => c.paidTo !== "treasurer").reduce((s,c) => s+(c.amount||0), 0);
  const freshDirect    = freshCols.filter(c => c.paidTo === "treasurer");
  const freshPending   = freshDirect.filter(c => !c.verifiedByCoordinator);
  const freshVerified  = freshDirect.filter(c => c.verifiedByCoordinator);
  const freshPendingAmt= freshPending.reduce((s,c) => s+(c.amount||0), 0);
  const freshVerifiedAmt=freshVerified.reduce((s,c) => s+(c.amount||0), 0);

  // Coordinator balance = fresh received - nothing (each remittance resets the cycle)
  const coordBalance   = freshToCoord;

  // Mode breakdown — fresh coordinator-received only
  const byMode = { cash:0, upi:0, bank:0, common:0 };
  freshCols.filter(c => c.paidTo !== "treasurer").forEach(c => {
    const mode = c.paymentMode || "cash";
    byMode[mode] = (byMode[mode]||0) + (c.amount||0);
    if (c.isCommon) byMode.common = (byMode.common||0) + (c.amount||0);
  });

  // Member-wise fresh breakdown
  const memberRows = members.map(m => {
    const mCols    = freshCols.filter(c => c.memberId === m.id || (m.memberId && c.memberId === m.memberId));
    const toCoord  = mCols.filter(c => c.paidTo !== "treasurer").reduce((s,c) => s+(c.amount||0), 0);
    const direct   = mCols.filter(c => c.paidTo === "treasurer").reduce((s,c) => s+(c.amount||0), 0);
    const pending  = mCols.filter(c => c.paidTo === "treasurer" && !c.verifiedByCoordinator).reduce((s,c) => s+(c.amount||0), 0);
    const mByMode  = { cash:0, upi:0, bank:0 };
    mCols.filter(c => c.paidTo !== "treasurer").forEach(c => { mByMode[c.paymentMode||"cash"] += (c.amount||0); });
    return { ...m, toCoord, direct, pending, mByMode, total: toCoord + direct };
  }).filter(m => m.total > 0).sort((a,b) => b.total - a.total);

  // Common ticket fresh income
  const commonFreshCols = freshCols.filter(c => {
    const book = books.find(b => b.id === c.bookId);
    return book?.isCommon;
  });
  const commonFreshAmt = commonFreshCols.reduce((s,c) => s+(c.amount||0), 0);

  // All-time for pending verification (not cycle-limited)
  const allDirectEntries = collections.filter(c => c.paidTo === "treasurer");
  const allPending       = allDirectEntries.filter(c => !c.verifiedByCoordinator);

  function openForm() {
    setAmount(String(coordBalance > 0 ? coordBalance : ""));
    setShowForm(true);
  }

  async function handleVerify(col) {
    setVerifying(col.id);
    await verifyDirectPayment(col.id);
    setVerifying(null);
  }

  async function handleSave() {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { showToast("Enter a valid amount", "error"); return; }
    if (!toWhom.trim())   { showToast("Enter recipient name", "error"); return; }
    setSaving(true);
    await addRemittance({
      date, amount: amt, toWhom: toWhom.trim(), paymentMode: payMode,
      notes: notes.trim(), balanceBefore: coordBalance, balanceAfter: coordBalance - amt,
      cycleFromDate: lastRemitDate || "beginning",
    });
    setAmount(""); setNotes(""); setShowForm(false); setSaving(false);
  }

  const isSA = can.viewLogs();

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0 }}>
          <i className="ti ti-arrow-left"/>
        </button>
        <div>
          <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>Remittance to treasurer</div>
          <div style={{ color:"rgba(255,255,255,0.65)", fontSize:10, marginTop:1 }}>
            {lastRemittance ? `Since ${lastRemitDate}` : "All collections"}
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 20px", background:"#f5f7f5" }}>

        {/* ── Coordinator balance card ── */}
        <div style={{ background:GREEN, borderRadius:13, padding:"14px 16px", marginBottom:12, color:"#fff" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginBottom:4 }}>
            Your balance in hand {lastRemittance ? `(since ${lastRemitDate})` : "(all time)"}
          </div>
          <div style={{ fontSize:32, fontWeight:700, color:"#fff", marginBottom:2 }}>{fmt(coordBalance)}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.55)" }}>
            Fresh money received by you since last remittance
          </div>
          {lastRemittance && (
            <div style={{ marginTop:10, background:"rgba(255,255,255,0.12)", borderRadius:8, padding:"7px 10px", fontSize:10, color:"rgba(255,255,255,0.7)" }}>
              <i className="ti ti-clock" style={{ marginRight:5 }}/>
              Last sent: {fmt(lastRemittance.amount)} on {lastRemittance.date} to {lastRemittance.toWhom}
            </div>
          )}
        </div>

        {/* ── Pending verifications (all time, not cycle limited) ── */}
        {allPending.length > 0 && (
          <>
            <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:7 }}>
              Pending verification — direct to treasurer ({allPending.length})
            </div>
            <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:9, padding:"8px 11px", marginBottom:10, display:"flex", gap:7 }}>
              <i className="ti ti-alert-triangle" style={{ color:"#f57c00", fontSize:15, flexShrink:0 }}/>
              <span style={{ fontSize:11, color:"#e65100", lineHeight:1.5 }}>
                These members say they paid the treasurer directly. Confirm with treasurer and tap Verify.
              </span>
            </div>
            {allPending.map(col => {
              const member = members.find(m => m.id===col.memberId || m.memberId===col.memberId);
              const book   = books.find(b => b.id===col.bookId);
              const busy   = verifying === col.id;
              const initials = member ? (member.firstName[0]+member.lastName[0]).toUpperCase() : "?";
              return (
                <div key={col.id} style={{ background:"#fff", borderRadius:11, border:"1px solid #ffe082", padding:"11px 13px", marginBottom:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
                    <div style={{ width:34, height:34, borderRadius:"50%", background:"#e8f5ee", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:GREEN, flexShrink:0 }}>{initials}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{member ? `${member.firstName} ${member.lastName}` : "Unknown"}</div>
                      <div style={{ fontSize:10, color:"#888", marginTop:1 }}>
                        {col.date} · {(col.paymentMode||"cash").toUpperCase()} · Book {book?.bookNumber||"—"}
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#e65100" }}>{fmt(col.amount)}</div>
                      <span style={{ fontSize:9, fontWeight:700, background:"#fff8e1", color:"#f57c00", padding:"1px 6px", borderRadius:5 }}>Pending</span>
                    </div>
                  </div>
                  {isSA && (
                    <button onClick={() => handleVerify(col)} disabled={busy}
                      style={{ width:"100%", background:busy?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:8, padding:"9px", fontSize:12, fontWeight:700, cursor:busy?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                      {busy
                        ? <><i className="ti ti-loader-2" style={{ animation:"spin 1s linear infinite" }}/> Verifying...</>
                        : <><i className="ti ti-circle-check" style={{ fontSize:14 }}/> Confirm — treasurer received this</>
                      }
                    </button>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* ── Fresh collections breakdown — BEFORE the send button ── */}
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>
          Your collection — by payment mode
        </div>

        {/* Mode cards */}
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          {[
            { mode:"cash",  icon:"ti-cash",          bg:"#e8f5ee", c:GREEN,     label:"Cash" },
            { mode:"upi",   icon:"ti-device-mobile",  bg:"#e3f2fd", c:"#1565c0", label:"UPI" },
            { mode:"bank",  icon:"ti-building-bank",  bg:"#fff3e0", c:"#7b4400", label:"Bank" },
          ].map(({ mode, icon, bg, c, label }) => (
            <div key={mode} style={{ flex:1, background:"#fff", borderRadius:9, border:"1px solid #eee", padding:"9px 6px", textAlign:"center" }}>
              <i className={`ti ${icon}`} style={{ fontSize:18, color:c }}/>
              <div style={{ fontSize:9, color:c, fontWeight:700, marginTop:3 }}>{label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginTop:2 }}>{fmt(byMode[mode])}</div>
            </div>
          ))}
        </div>

        {/* Common book income */}
        {commonFreshAmt > 0 && (
          <div style={{ background:"#f3e5f5", borderRadius:9, border:"1px solid #ce93d830", padding:"9px 12px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <i className="ti ti-pool" style={{ color:"#4a148c", fontSize:16 }}/>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#4a148c" }}>From common books</div>
                <div style={{ fontSize:10, color:"#888" }}>Included in above totals</div>
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:"#4a148c" }}>{fmt(commonFreshAmt)}</div>
          </div>
        )}

        {/* Direct to treasurer fresh */}
        {freshVerifiedAmt > 0 && (
          <div style={{ background:"#e3f2fd", borderRadius:9, border:"1px solid #90caf9", padding:"9px 12px", marginBottom:10, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <i className="ti ti-send" style={{ color:"#1565c0", fontSize:16 }}/>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:"#1565c0" }}>Direct to treasurer (verified)</div>
                <div style={{ fontSize:10, color:"#888" }}>Bypassed coordinator</div>
              </div>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:"#1565c0" }}>{fmt(freshVerifiedAmt)}</div>
          </div>
        )}

        {/* Member-wise fresh */}
        {memberRows.length > 0 && (
          <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"11px 13px", marginBottom:12 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a", marginBottom:8 }}>Member-wise (this cycle)</div>
            {memberRows.map((m, i) => (
              <div key={m.id} style={{ paddingBottom:8, marginBottom:8, borderBottom:i<memberRows.length-1?"0.5px solid #f5f5f5":"none" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>{fmt(m.toCoord)}</div>
                </div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap", fontSize:10 }}>
                  {m.mByMode.cash  > 0 && <span style={{ color:GREEN }}>Cash: {fmt(m.mByMode.cash)}</span>}
                  {m.mByMode.upi   > 0 && <span style={{ color:"#1565c0" }}>UPI: {fmt(m.mByMode.upi)}</span>}
                  {m.mByMode.bank  > 0 && <span style={{ color:"#7b4400" }}>Bank: {fmt(m.mByMode.bank)}</span>}
                  {m.direct > 0 && (
                    <span style={{ color: m.pending>0?"#f57c00":"#1565c0" }}>
                      Direct: {fmt(m.direct)}{m.pending>0?` (${fmt(m.pending)} unverified)`:" ✓"}
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #f0f0f0", paddingTop:8, fontSize:12 }}>
              <span style={{ fontWeight:700, color:"#1a1a1a" }}>Total with you</span>
              <span style={{ fontWeight:700, color:GREEN }}>{fmt(coordBalance)}</span>
            </div>
          </div>
        )}

        {memberRows.length === 0 && (
          <div style={{ textAlign:"center", color:"#aaa", fontSize:12, padding:"16px 0", marginBottom:10 }}>
            No collections since last remittance
          </div>
        )}

        {/* ── Record money sent — AFTER the breakdown ── */}
        {showForm ? (
          <div style={{ background:"#fff", borderRadius:13, border:`2px solid ${GREEN}`, padding:"14px", marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>
                <i className="ti ti-send" style={{ marginRight:5 }}/>Record money sent to treasurer
              </div>
              <button onClick={()=>setShowForm(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#aaa", fontSize:18 }}>✕</button>
            </div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Date *</div>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${GREEN}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Amount *</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)}
                style={{ width:"100%", background:"#f0f9f4", border:`2px solid ${GREEN}`, borderRadius:9, padding:"10px 11px", fontSize:18, fontWeight:700, color:GREEN, outline:"none", boxSizing:"border-box" }}/>
              <div style={{ fontSize:10, color:"#888", marginTop:3, display:"flex", justifyContent:"space-between" }}>
                <span>Your current balance in hand</span>
                <span style={{ color:GREEN, fontWeight:600 }}>{fmt(parseInt(amount)||0)}</span>
              </div>
              {parseInt(amount) > coordBalance && (
                <div style={{ fontSize:10, color:"#e65100", marginTop:3 }}>Exceeds your balance of {fmt(coordBalance)}</div>
              )}
            </div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:4 }}>Sent to *</div>
              <input value={toWhom} onChange={e=>setToWhom(e.target.value)} placeholder="Treasurer name"
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${toWhom?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"9px 11px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            </div>

            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:6 }}>Payment mode</div>
              <div style={{ display:"flex", gap:6 }}>
                {["cash","upi","bank"].map(m=>(
                  <div key={m} onClick={()=>setPayMode(m)}
                    style={{ flex:1, border:`${payMode===m?"2px":"1px"} solid ${payMode===m?GREEN:"#e0e0e0"}`, borderRadius:8, padding:"8px 4px", background:payMode===m?"#e8f5ee":"#fff", textAlign:"center", fontSize:11, color:payMode===m?GREEN:"#888", fontWeight:payMode===m?700:400, cursor:"pointer" }}>
                    <i className={`ti ${m==="cash"?"ti-cash":m==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:15, display:"block", marginBottom:3 }}/>
                    {m.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)"
              style={{ width:"100%", background:"#f8faf8", border:"1px solid #e0e0e0", borderRadius:9, padding:"9px 11px", fontSize:12, outline:"none", boxSizing:"border-box", marginBottom:12 }}/>

            {/* Before/after preview */}
            {amount && (
              <div style={{ background:"#f5f7f5", borderRadius:8, padding:"9px 11px", marginBottom:12 }}>
                <div style={{ fontSize:10, color:"#aaa", marginBottom:5 }}>After sending</div>
                {[
                  ["Balance now",   fmt(coordBalance),                      "#1a1a1a"],
                  ["Sending",       `− ${fmt(parseInt(amount)||0)}`,         "#e65100"],
                  ["Balance after", fmt(coordBalance-(parseInt(amount)||0)), (coordBalance-(parseInt(amount)||0))>=0?GREEN:"#c62828"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:11, padding:"3px 0" }}>
                    <span style={{ color:"#777" }}>{l}</span>
                    <span style={{ fontWeight:700, color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              style={{ width:"100%", background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:10, padding:"12px", fontSize:13, fontWeight:700, cursor:saving?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              <i className="ti ti-send" style={{ fontSize:15 }}/>{saving?"Saving...":"Send & record remittance"}
            </button>
          </div>
        ) : (
          <button onClick={openForm}
            style={{ width:"100%", background:`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:"0 4px 14px rgba(26,107,60,0.25)", marginBottom:12 }}>
            <i className="ti ti-send" style={{ fontSize:17 }}/> Record money sent to treasurer
          </button>
        )}

        {/* Remittance summary */}
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"12px 14px" }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a", marginBottom:10 }}>Remittance summary</div>
          {[
            ["Total ever sent",    fmt(remittances.reduce((s,r)=>s+(r.amount||0),0)), "#1565c0"],
            ["Times remitted",     remittances.length,                                 "#1a1a1a"],
            lastRemittance && ["Last sent on", lastRemittance.date, "#888"],
          ].filter(Boolean).map(([l,v,c])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"0.5px solid #f5f5f5", fontSize:11 }}>
              <span style={{ color:"#777" }}>{l}</span>
              <span style={{ fontWeight:700, color:c }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop:8, background:"#e3f2fd", borderRadius:8, padding:"7px 10px", display:"flex", gap:7 }}>
            <i className="ti ti-chart-bar" style={{ color:"#1565c0", fontSize:14, flexShrink:0 }}/>
            <span style={{ fontSize:11, color:"#1565c0" }}>Full history with dates → <strong>Reports → Remittance Report</strong></span>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
