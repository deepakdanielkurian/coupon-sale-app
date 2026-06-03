import { useState } from "react";
import { useApp } from "../data/AppContext";
import { fmt } from "../data/store";

const GREEN = "#1a6b3c";

export default function RemittanceScreen({ onBack }) {
  const { data, addRemittance, verifyDirectPayment, showToast, can } = useApp();
  const { remittances=[], collections, members, books } = data;

  const [showForm, setShowForm] = useState(false);
  const [date,    setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [amount,  setAmount]    = useState("");
  const [toWhom,  setToWhom]    = useState("Treasurer");
  const [payMode, setPayMode]   = useState("cash");
  const [notes,   setNotes]     = useState("");
  const [saving,  setSaving]    = useState(false);
  const [verifying, setVerifying] = useState(null);

  // ── Money calculations ──────────────────────────────────────
  // Coordinator balance = only money that came TO coordinator (not direct-to-treasurer)
  const coordReceived = collections.reduce((s,c) =>
    c.paidTo === "treasurer" ? s : s + (c.amount||0), 0);

  // Direct to treasurer entries
  const directEntries = collections.filter(c => c.paidTo === "treasurer");
  const pendingVerify = directEntries.filter(c => !c.verifiedByCoordinator);
  const verifiedDirect= directEntries.filter(c =>  c.verifiedByCoordinator);
  const pendingAmt    = pendingVerify.reduce((s,c)=>s+(c.amount||0),0);
  const verifiedAmt   = verifiedDirect.reduce((s,c)=>s+(c.amount||0),0);

  // What coordinator has already sent to treasurer
  const totalRemitted = remittances.reduce((s,r)=>s+(r.amount||0),0);

  // Coordinator balance in hand = received by coordinator minus already remitted
  const coordBalance  = coordReceived - totalRemitted;

  // Mode breakdown — only coordinator-received money
  const byMode = {cash:0,upi:0,bank:0};
  collections.filter(c=>c.paidTo!=="treasurer").forEach(c=>{
    byMode[c.paymentMode||"cash"]+=(c.amount||0);
  });

  // Grand total received (coordinator + verified direct)
  const grandTotal = coordReceived + verifiedAmt;

  // Member breakdown
  const memberRows = members.map(m=>{
    const mCols = collections.filter(c=>c.memberId===m.id);
    const toCoord = mCols.filter(c=>c.paidTo!=="treasurer").reduce((s,c)=>s+(c.amount||0),0);
    const direct  = mCols.filter(c=>c.paidTo==="treasurer").reduce((s,c)=>s+(c.amount||0),0);
    const pending = mCols.filter(c=>c.paidTo==="treasurer"&&!c.verifiedByCoordinator).reduce((s,c)=>s+(c.amount||0),0);
    const mByMode={cash:0,upi:0,bank:0};
    mCols.filter(c=>c.paidTo!=="treasurer").forEach(c=>{mByMode[c.paymentMode||"cash"]+=(c.amount||0);});
    return {...m, toCoord, direct, pending, mByMode, total:toCoord+direct};
  }).filter(m=>m.total>0).sort((a,b)=>b.total-a.total);

  async function handleVerify(col) {
    setVerifying(col.id);
    await verifyDirectPayment(col.id);
    setVerifying(null);
  }

  async function handleSave() {
    const amt=parseInt(amount);
    if(!amt||amt<=0){showToast("Enter a valid amount","error");return;}
    if(!toWhom.trim()){showToast("Enter recipient name","error");return;}
    setSaving(true);
    await addRemittance({ date, amount:amt, toWhom:toWhom.trim(), paymentMode:payMode, notes:notes.trim(), balanceBefore:coordBalance, balanceAfter:coordBalance-amt, totalCollectedAtTime:coordReceived });
    setAmount(""); setNotes(""); setShowForm(false); setSaving(false);
  }

  const isSA = can.viewLogs(); // super admin check

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0 }}>
          <i className="ti ti-arrow-left"/>
        </button>
        <div>
          <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Remittance to treasurer</div>
          <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>Record & view summary</div>
        </div>
      </div>

      <div style={{ flex:1,overflowY:"auto",padding:"12px 12px 20px",background:"#f5f7f5" }}>

        {/* Coordinator balance card */}
        <div style={{ background:GREEN,borderRadius:13,padding:"14px 16px",marginBottom:12,color:"#fff" }}>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.6)",marginBottom:4 }}>Your balance in hand</div>
          <div style={{ fontSize:30,fontWeight:700,color:"#fff",marginBottom:2 }}>{fmt(coordBalance)}</div>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.55)" }}>Money received by you − already remitted</div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:12 }}>
            {[
              {l:"You received",  v:fmt(coordReceived)},
              {l:"You remitted",  v:fmt(totalRemitted)},
              {l:"Your balance",  v:fmt(coordBalance)},
            ].map((s,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.15)",borderRadius:8,padding:"6px 8px",textAlign:"center" }}>
                <div style={{ fontSize:8,color:"rgba(255,255,255,0.6)" }}>{s.l}</div>
                <div style={{ fontSize:11,fontWeight:700,color:"#fff",marginTop:2 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Grand total summary */}
        <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"11px 13px",marginBottom:12 }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a",marginBottom:8 }}>Grand total picture</div>
          {[
            ["Received by coordinator",       fmt(coordReceived),  GREEN],
            ["Direct to treasurer (verified)", fmt(verifiedAmt),  "#1565c0"],
            ["Direct to treasurer (pending)",  fmt(pendingAmt),   "#f57c00"],
            ["Total all collections",          fmt(grandTotal+pendingAmt), "#1a1a1a"],
          ].map(([l,v,c])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"0.5px solid #f5f5f5",fontSize:11 }}>
              <span style={{ color:"#777" }}>{l}</span>
              <span style={{ fontWeight:700,color:c }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Pending verification */}
        {pendingVerify.length>0&&(
          <>
            <div style={{ fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:7 }}>
              Pending verification — direct to treasurer ({pendingVerify.length})
            </div>
            <div style={{ background:"#fff8e1",border:"1px solid #ffe082",borderRadius:9,padding:"8px 11px",marginBottom:10,display:"flex",gap:7 }}>
              <i className="ti ti-alert-triangle" style={{ color:"#f57c00",fontSize:15,flexShrink:0 }}/>
              <span style={{ fontSize:11,color:"#e65100",lineHeight:1.5 }}>These members say they paid the treasurer directly. Verify with treasurer and tap Confirm.</span>
            </div>
            {pendingVerify.map(col=>{
              const member=members.find(m=>m.id===col.memberId);
              const book=books.find(b=>b.id===col.bookId);
              const initials=member?(member.firstName[0]+member.lastName[0]).toUpperCase():"?";
              const busy=verifying===col.id;
              return(
                <div key={col.id} style={{ background:"#fff",borderRadius:11,border:"1px solid #ffe082",padding:"11px 13px",marginBottom:8 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                    <div style={{ width:34,height:34,borderRadius:"50%",background:"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:GREEN,flexShrink:0 }}>{initials}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a" }}>{member?`${member.firstName} ${member.lastName}`:"Unknown"}</div>
                      <div style={{ fontSize:10,color:"#888",marginTop:1 }}>{col.date} · {(col.paymentMode||"cash").toUpperCase()} · Book {book?.bookNumber||"—"}</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:15,fontWeight:700,color:"#e65100" }}>{fmt(col.amount)}</div>
                      <span style={{ fontSize:9,fontWeight:700,background:"#fff8e1",color:"#f57c00",padding:"1px 6px",borderRadius:5 }}>Pending</span>
                    </div>
                  </div>
                  {isSA&&(
                    <button onClick={()=>handleVerify(col)} disabled={busy}
                      style={{ width:"100%",background:busy?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:12,fontWeight:700,cursor:busy?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6 }}>
                      {busy
                        ? <><i className="ti ti-loader-2" style={{ animation:"spin 1s linear infinite" }}/> Verifying...</>
                        : <><i className="ti ti-circle-check" style={{ fontSize:14 }}/> Confirm — treasurer received this</>
                      }
                    </button>
                  )}
                  {!isSA&&<div style={{ fontSize:10,color:"#aaa",textAlign:"center",marginTop:4 }}>Only super admin can verify direct payments</div>}
                </div>
              );
            })}
          </>
        )}

        {/* Mode breakdown */}
        <div style={{ fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:7 }}>
          Your collection — by payment mode
        </div>
        <div style={{ display:"flex",gap:6,marginBottom:12 }}>
          {[
            {mode:"cash", icon:"ti-cash",         bg:"#e8f5ee", c:GREEN,    label:"Cash"},
            {mode:"upi",  icon:"ti-device-mobile", bg:"#e3f2fd", c:"#1565c0",label:"UPI"},
            {mode:"bank", icon:"ti-building-bank", bg:"#fff3e0", c:"#7b4400",label:"Bank"},
          ].map(({mode,icon,bg,c,label})=>(
            <div key={mode} style={{ flex:1,background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"9px 6px",textAlign:"center" }}>
              <i className={`ti ${icon}`} style={{ fontSize:18,color:c }}/>
              <div style={{ fontSize:9,color:c,fontWeight:700,marginTop:3 }}>{label}</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginTop:2 }}>{fmt(byMode[mode])}</div>
            </div>
          ))}
        </div>

        {/* Member breakdown */}
        <div style={{ fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:7 }}>
          Member-wise collected
        </div>
        <div style={{ background:"#fff",borderRadius:12,border:"1px solid #eee",padding:"11px 13px",marginBottom:12 }}>
          {memberRows.length===0&&<div style={{ fontSize:12,color:"#aaa",textAlign:"center",padding:"8px 0" }}>No collections yet</div>}
          {memberRows.map((m,i)=>(
            <div key={m.id} style={{ paddingBottom:8,marginBottom:8,borderBottom:i<memberRows.length-1?"0.5px solid #f5f5f5":"none" }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div>
                <div style={{ fontSize:13,fontWeight:700,color:GREEN }}>{fmt(m.toCoord)}</div>
              </div>
              <div style={{ display:"flex",gap:10,flexWrap:"wrap",fontSize:10 }}>
                {m.mByMode.cash>0&&<span style={{ color:GREEN }}>Cash: {fmt(m.mByMode.cash)}</span>}
                {m.mByMode.upi>0&&<span style={{ color:"#1565c0" }}>UPI: {fmt(m.mByMode.upi)}</span>}
                {m.mByMode.bank>0&&<span style={{ color:"#7b4400" }}>Bank: {fmt(m.mByMode.bank)}</span>}
                {m.direct>0&&<span style={{ color:m.pending>0?"#f57c00":"#1565c0" }}>Direct: {fmt(m.direct)}{m.pending>0?` (${fmt(m.pending)} unverified)`:""}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Send to treasurer form */}
        {showForm?(
          <div style={{ background:"#fff",borderRadius:13,border:`2px solid ${GREEN}`,padding:"14px",marginBottom:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:700,color:GREEN }}><i className="ti ti-send" style={{ marginRight:5 }}/>Record money sent to treasurer</div>
              <button onClick={()=>setShowForm(false)} style={{ background:"none",border:"none",cursor:"pointer",color:"#aaa",fontSize:18 }}>✕</button>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:4 }}>Date *</div>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                style={{ width:"100%",background:"#f8faf8",border:`1.5px solid ${GREEN}`,borderRadius:9,padding:"9px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:4 }}>Amount (Rs.) *</div>
              <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Enter amount"
                style={{ width:"100%",background:"#f8faf8",border:`1.5px solid ${amount?GREEN:"#e0e0e0"}`,borderRadius:9,padding:"9px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
              {amount&&<div style={{ fontSize:11,fontWeight:700,color:GREEN,marginTop:4 }}>{fmt(parseInt(amount)||0)}</div>}
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:4 }}>Sent to *</div>
              <input value={toWhom} onChange={e=>setToWhom(e.target.value)} placeholder="Treasurer name"
                style={{ width:"100%",background:"#f8faf8",border:`1.5px solid ${toWhom?GREEN:"#e0e0e0"}`,borderRadius:9,padding:"9px 11px",fontSize:13,outline:"none",boxSizing:"border-box" }}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:6 }}>Payment mode</div>
              <div style={{ display:"flex",gap:6 }}>
                {["cash","upi","bank"].map(m=>(
                  <div key={m} onClick={()=>setPayMode(m)}
                    style={{ flex:1,border:`${payMode===m?"2px":"1px"} solid ${payMode===m?GREEN:"#e0e0e0"}`,borderRadius:8,padding:"8px 4px",background:payMode===m?"#e8f5ee":"#fff",textAlign:"center",fontSize:11,color:payMode===m?GREEN:"#888",fontWeight:payMode===m?700:400,cursor:"pointer" }}>
                    <i className={`ti ${m==="cash"?"ti-cash":m==="upi"?"ti-device-mobile":"ti-building-bank"}`} style={{ fontSize:15,display:"block",marginBottom:3 }}/>
                    {m.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
            <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes (optional)"
              style={{ width:"100%",background:"#f8faf8",border:"1px solid #e0e0e0",borderRadius:9,padding:"9px 11px",fontSize:12,outline:"none",boxSizing:"border-box",marginBottom:12 }}/>
            {amount&&(
              <div style={{ background:"#f5f7f5",borderRadius:8,padding:"9px 11px",marginBottom:12 }}>
                <div style={{ fontSize:10,color:"#aaa",marginBottom:5 }}>After this entry</div>
                {[
                  ["Balance before",  fmt(coordBalance),                    "#1a1a1a"],
                  ["Sending",         `− ${fmt(parseInt(amount)||0)}`,       "#e65100"],
                  ["Balance after",   fmt(coordBalance-(parseInt(amount)||0)),(coordBalance-(parseInt(amount)||0))>=0?GREEN:"#c62828"],
                ].map(([l,v,c])=>(
                  <div key={l} style={{ display:"flex",justifyContent:"space-between",fontSize:11,padding:"3px 0" }}>
                    <span style={{ color:"#777" }}>{l}</span>
                    <span style={{ fontWeight:700,color:c }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              style={{ width:"100%",background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer" }}>
              {saving?"Saving...":"Save remittance entry"}
            </button>
          </div>
        ):(
          <button onClick={()=>setShowForm(true)}
            style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(26,107,60,0.25)",marginBottom:12 }}>
            <i className="ti ti-send" style={{ fontSize:17 }}/> Record money sent to treasurer
          </button>
        )}

        {/* Remittance history */}
        <div style={{ fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>
          Remittance history ({remittances.length})
        </div>
        {remittances.length===0&&<div style={{ textAlign:"center",color:"#aaa",fontSize:12,padding:"16px 0" }}>No remittances recorded yet</div>}
        {remittances.map((r,i)=>(
          <div key={r.id} style={{ background:"#fff",borderRadius:11,border:"1px solid #eee",padding:"10px 12px",marginBottom:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:"#1565c0" }}>{fmt(r.amount)}</div>
                <div style={{ fontSize:10,color:"#888",marginTop:1 }}>{r.date} · To {r.toWhom} · {(r.paymentMode||"cash").toUpperCase()}</div>
              </div>
              {i===0&&<span style={{ fontSize:9,fontWeight:700,background:"#e3f2fd",color:"#1565c0",padding:"2px 7px",borderRadius:6 }}>Latest</span>}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:5 }}>
              <div style={{ background:"#f5f7f5",borderRadius:7,padding:"5px 8px" }}>
                <div style={{ fontSize:9,color:"#aaa" }}>Balance before</div>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{fmt(r.balanceBefore||0)}</div>
              </div>
              <div style={{ background:"#e8f5ee",borderRadius:7,padding:"5px 8px" }}>
                <div style={{ fontSize:9,color:"#aaa" }}>Balance after</div>
                <div style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(r.balanceAfter||0)}</div>
              </div>
            </div>
            {r.notes&&<div style={{ fontSize:10,color:"#888",marginTop:6 }}>{r.notes}</div>}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
