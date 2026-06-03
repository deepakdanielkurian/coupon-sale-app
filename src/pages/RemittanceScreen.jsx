import { useState } from "react";
import { useApp } from "../data/AppContext";
import { fmt } from "../data/store";

const GREEN = "#1a6b3c";

export default function RemittanceScreen({ onBack }) {
  const { data, addRemittance, showToast } = useApp();
  const { remittances, collections, members, books } = data;

  const [showForm, setShowForm] = useState(false);
  const [date,    setDate]      = useState(new Date().toISOString().split("T")[0]);
  const [amount,  setAmount]    = useState("");
  const [toWhom,  setToWhom]    = useState("Treasurer");
  const [payMode, setPayMode]   = useState("cash");
  const [notes,   setNotes]     = useState("");
  const [saving,  setSaving]    = useState(false);

  // All collections totals
  const totalCollected = collections.reduce((s,c)=>s+(c.amount||0), 0);
  const byMode = { cash:0, upi:0, bank:0 };
  collections.forEach(c=>{ byMode[c.paymentMode||"cash"] += (c.amount||0); });

  // Member-wise breakdown
  const memberBreakdown = members.map(m=>{
    const mCols = collections.filter(c=>c.memberId===m.id);
    const total  = mCols.reduce((s,c)=>s+(c.amount||0),0);
    const mByMode= {cash:0,upi:0,bank:0};
    mCols.forEach(c=>{ mByMode[c.paymentMode||"cash"]+=(c.amount||0); });
    return { ...m, total, byMode:mByMode, entries:mCols.length };
  }).filter(m=>m.total>0).sort((a,b)=>b.total-a.total);

  // Remittance totals
  const totalRemitted = remittances.reduce((s,r)=>s+(r.amount||0),0);
  const balanceInHand = totalCollected - totalRemitted;

  async function handleSave() {
    const amt = parseInt(amount);
    if (!amt||amt<=0) { showToast("Enter a valid amount","error"); return; }
    if (!toWhom.trim()) { showToast("Enter recipient name","error"); return; }
    setSaving(true);
    await addRemittance({
      date, amount:amt, toWhom:toWhom.trim(), paymentMode:payMode, notes:notes.trim(),
      balanceBefore: balanceInHand, balanceAfter: balanceInHand - amt,
      totalCollectedAtTime: totalCollected,
    });
    setAmount(""); setNotes(""); setShowForm(false);
    setSaving(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>
      <div style={{ background:GREEN, padding:"10px 14px 12px", display:"flex", alignItems:"center", gap:10 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#fff",fontSize:20,cursor:"pointer",padding:0 }}>
          <i className="ti ti-arrow-left"/>
        </button>
        <div>
          <div style={{ color:"#fff",fontSize:15,fontWeight:700 }}>Remittance to treasurer</div>
          <div style={{ color:"rgba(255,255,255,0.65)",fontSize:10,marginTop:1 }}>Record money sent to treasurer</div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"12px 12px 20px", background:"#f5f7f5" }}>

        {/* Summary cards */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:12 }}>
          {[
            { l:"Total collected",   v:fmt(totalCollected), c:GREEN },
            { l:"Total remitted",    v:fmt(totalRemitted),  c:"#1565c0" },
            { l:"Balance in hand",   v:fmt(balanceInHand),  c:balanceInHand>0?"#e65100":GREEN },
            { l:"Remittances made",  v:remittances.length,  c:"#1a1a1a" },
          ].map((s,i)=>(
            <div key={i} style={{ background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"9px 10px" }}>
              <div style={{ fontSize:10,color:"#aaa" }}>{s.l}</div>
              <div style={{ fontSize:16,fontWeight:700,color:s.c,marginTop:2 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Mode breakdown */}
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"11px 13px", marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a", marginBottom:8 }}>Total collected — by payment mode</div>
          <div style={{ display:"flex", gap:6 }}>
            {[
              { mode:"cash",  icon:"ti-cash",           bg:"#e8f5ee", c:GREEN,    label:"Cash" },
              { mode:"upi",   icon:"ti-device-mobile",  bg:"#e3f2fd", c:"#1565c0",label:"UPI" },
              { mode:"bank",  icon:"ti-building-bank",  bg:"#fff3e0", c:"#854F0B",label:"Bank" },
            ].map(({mode,icon,bg,c,label})=>(
              <div key={mode} style={{ flex:1,background:bg,borderRadius:9,padding:"8px 6px",textAlign:"center" }}>
                <i className={`ti ${icon}`} style={{ fontSize:18,color:c }}/>
                <div style={{ fontSize:9,color:c,fontWeight:700,marginTop:3 }}>{label}</div>
                <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a",marginTop:2 }}>{fmt(byMode[mode])}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Member-wise collected */}
        <div style={{ background:"#fff", borderRadius:12, border:"1px solid #eee", padding:"11px 13px", marginBottom:12 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a", marginBottom:8 }}>Member-wise collection</div>
          {memberBreakdown.map((m,i)=>(
            <div key={m.id} style={{ paddingBottom:8, marginBottom:8, borderBottom:i<memberBreakdown.length-1?"0.5px solid #f5f5f5":"none" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a" }}>{m.firstName} {m.lastName}</div>
                <div style={{ fontSize:13, fontWeight:700, color:GREEN }}>{fmt(m.total)}</div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                {[["Cash",m.byMode.cash,GREEN],["UPI",m.byMode.upi,"#1565c0"],["Bank",m.byMode.bank,"#854F0B"]].map(([l,v,c])=>(
                  v>0&&<div key={l} style={{ fontSize:10,color:c }}>{l}: {fmt(v)}</div>
                ))}
                <div style={{ fontSize:10,color:"#aaa",marginLeft:"auto" }}>{m.entries} entries</div>
              </div>
            </div>
          ))}
          {memberBreakdown.length===0&&<div style={{ fontSize:12,color:"#aaa",textAlign:"center",padding:"10px 0" }}>No collections yet</div>}
        </div>

        {/* Add remittance */}
        {showForm ? (
          <div style={{ background:"#fff", borderRadius:12, border:`2px solid ${GREEN}`, padding:"13px", marginBottom:12 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
              <div style={{ fontSize:13,fontWeight:700,color:GREEN }}>Record money sent to treasurer</div>
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
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#555",marginBottom:4 }}>Notes (optional)</div>
              <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any remarks..."
                style={{ width:"100%",background:"#f8faf8",border:"1px solid #e0e0e0",borderRadius:9,padding:"9px 11px",fontSize:12,outline:"none",boxSizing:"border-box" }}/>
            </div>

            {/* Preview */}
            {amount&&(
              <div style={{ background:"#f5f7f5",borderRadius:8,padding:"9px 11px",marginBottom:12 }}>
                <div style={{ fontSize:10,color:"#aaa",marginBottom:5 }}>After this entry</div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3 }}>
                  <span style={{ color:"#777" }}>Balance before</span>
                  <span style={{ fontWeight:700 }}>{fmt(balanceInHand)}</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3 }}>
                  <span style={{ color:"#777" }}>Sending</span>
                  <span style={{ fontWeight:700,color:"#1565c0" }}>−{fmt(parseInt(amount)||0)}</span>
                </div>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:12,borderTop:"0.5px solid #e0e0e0",paddingTop:5,marginTop:5 }}>
                  <span style={{ fontWeight:700 }}>Balance after</span>
                  <span style={{ fontWeight:700,color:(balanceInHand-(parseInt(amount)||0))>=0?GREEN:"#dc2626" }}>{fmt(balanceInHand-(parseInt(amount)||0))}</span>
                </div>
              </div>
            )}

            <button onClick={handleSave} disabled={saving}
              style={{ width:"100%",background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:10,padding:"12px",fontSize:13,fontWeight:700,cursor:saving?"not-allowed":"pointer",boxShadow:"0 3px 12px rgba(26,107,60,0.25)" }}>
              {saving?"Saving...":"Save remittance entry"}
            </button>
          </div>
        ) : (
          <button onClick={()=>setShowForm(true)}
            style={{ width:"100%",background:`linear-gradient(135deg,${GREEN},#2e7d32)`,color:"#fff",border:"none",borderRadius:12,padding:"13px",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 14px rgba(26,107,60,0.25)",marginBottom:12 }}>
            <i className="ti ti-send" style={{ fontSize:17 }}/> Record money sent to treasurer
          </button>
        )}

        {/* Remittance history */}
        <div style={{ fontSize:10,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8 }}>
          Remittance history ({remittances.length})
        </div>
        {remittances.length===0&&(
          <div style={{ textAlign:"center",color:"#aaa",fontSize:12,padding:"20px 0" }}>No remittances recorded yet</div>
        )}
        {remittances.map((r,i)=>(
          <div key={r.id} style={{ background:"#fff",borderRadius:11,border:"1px solid #eee",padding:"10px 12px",marginBottom:8 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6 }}>
              <div>
                <div style={{ fontSize:14,fontWeight:700,color:"#1565c0" }}>{fmt(r.amount)}</div>
                <div style={{ fontSize:10,color:"#888",marginTop:1 }}>
                  {r.date} · To {r.toWhom} · {(r.paymentMode||"cash").toUpperCase()}
                </div>
              </div>
              {i===0&&<span style={{ fontSize:9,fontWeight:700,background:"#e3f2fd",color:"#1565c0",padding:"2px 7px",borderRadius:6 }}>Latest</span>}
            </div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginTop:6 }}>
              <div style={{ background:"#f5f7f5",borderRadius:7,padding:"5px 8px" }}>
                <div style={{ fontSize:9,color:"#aaa" }}>Balance before</div>
                <div style={{ fontSize:12,fontWeight:700,color:"#1a1a1a" }}>{fmt(r.balanceBefore||0)}</div>
              </div>
              <div style={{ background:"#e8f5ee",borderRadius:7,padding:"5px 8px" }}>
                <div style={{ fontSize:9,color:"#aaa" }}>Balance after</div>
                <div style={{ fontSize:12,fontWeight:700,color:GREEN }}>{fmt(r.balanceAfter||0)}</div>
              </div>
            </div>
            {r.notes&&<div style={{ fontSize:10,color:"#888",marginTop:5 }}>{r.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
