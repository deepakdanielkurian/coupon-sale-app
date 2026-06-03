import { LABELS } from "../data/store";
const G = "#1a6b3c";

export function Badge({ type="committee_member" }) {
  const cfg = LABELS[type]||LABELS.committee_member;
  return <span style={{display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:8,fontWeight:600,background:cfg.bg,color:cfg.color}}>{cfg.label}</span>;
}

export function StatusBadge({ status, stopped }) {
  const map = {
    complete:    { bg:"#e8f5ee", color:"#1a6b3c", label:"Complete" },
    ongoing:     { bg:"#fff3e0", color:"#e65100", label:"Ongoing" },
    not_started: { bg:"#ffebee", color:"#c62828", label:"Not started" },
  };
  // Stopped selling = complete but with returned tickets
  const c = stopped
    ? { bg:"#fff3e0", color:"#e65100", label:"Stopped" }
    : map[status] || { bg:"#f5f5f5", color:"#777", label:status };
  return <span style={{display:"inline-block",fontSize:9,padding:"2px 7px",borderRadius:8,fontWeight:600,background:c.bg,color:c.color}}>{c.label}</span>;
}

export function Avatar({ name, size=36, bg="#e8f5ee", color="#1a6b3c" }) {
  const initials = name?name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase():"?";
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.33,fontWeight:700,flexShrink:0}}>{initials}</div>;
}

export function Card({ children, style={}, onClick }) {
  return <div onClick={onClick} style={{background:"#fff",borderRadius:10,border:"1px solid #eee",padding:"10px 12px",marginBottom:8,cursor:onClick?"pointer":"default",...style}}>{children}</div>;
}

export function SectionLabel({ children }) {
  return <div style={{fontSize:11,fontWeight:600,color:"#555",textTransform:"uppercase",letterSpacing:"0.5px",margin:"12px 0 7px"}}>{children}</div>;
}

export function ProgressBar({ value, max, color=G }) {
  const pct = max>0?Math.min(100,Math.round((value/max)*100)):0;
  return (
    <div style={{flex:1,height:7,background:"#f0f0f0",borderRadius:4,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:4,transition:"width 0.4s"}}/>
    </div>
  );
}

export function InfoChip({ children, type="warn" }) {
  const cfg={warn:{bg:"#fff8e1",color:"#e65100",icon:"ti-info-circle"},success:{bg:"#e8f5ee",color:"#1a6b3c",icon:"ti-circle-check"},error:{bg:"#ffebee",color:"#c62828",icon:"ti-alert-circle"}}[type];
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:7,background:cfg.bg,borderRadius:9,padding:"8px 10px",marginBottom:10}}>
      <i className={`ti ${cfg.icon}`} style={{color:cfg.color,fontSize:14,flexShrink:0,marginTop:1}}/>
      <span style={{fontSize:11,color:cfg.color,lineHeight:1.5}}>{children}</span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{width:"100%",background:disabled?"#e0e0e0":`linear-gradient(135deg,${G},#2e7d32)`,color:disabled?"#aaa":"#fff",border:"none",borderRadius:10,padding:12,fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",boxShadow:disabled?"none":"0 3px 10px rgba(26,107,60,0.25)",marginTop:4,...style}}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, style={} }) {
  return (
    <button onClick={onClick} style={{width:"100%",background:"#fff",color:G,border:`1.5px solid ${G}`,borderRadius:10,padding:11,fontSize:12,fontWeight:600,cursor:"pointer",marginTop:8,...style}}>
      {children}
    </button>
  );
}

export function InputField({ label, value, onChange, placeholder, type="text", disabled, required, error }) {
  return (
    <div style={{marginBottom:10}}>
      <div style={{fontSize:11,color:"#555",fontWeight:500,marginBottom:4}}>{label}{required&&" *"}</div>
      <input type={type} value={value} onChange={e=>onChange&&onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{width:"100%",background:disabled?"#f5f5f5":"#fff",border:`1.5px solid ${error?"#dc2626":value?G:"#e0e0e0"}`,borderRadius:9,padding:"9px 11px",fontSize:13,color:disabled?"#aaa":"#1a1a1a",outline:"none",boxSizing:"border-box",transition:"border 0.2s"}}/>
      {error&&<div style={{fontSize:10,color:"#dc2626",marginTop:3}}>{error}</div>}
    </div>
  );
}

export function StatGrid({ stats }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
      {stats.map((s,i)=>(
        <div key={i} style={{background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"8px 10px"}}>
          <div style={{fontSize:10,color:"#888"}}>{s.label}</div>
          <div style={{fontSize:16,fontWeight:700,color:s.color||"#1a1a1a",marginTop:2}}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}


