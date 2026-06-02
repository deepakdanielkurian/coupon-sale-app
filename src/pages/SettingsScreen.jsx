import { useApp } from "../data/AppContext";
import { ROLES, fmt } from "../data/store";

const GREEN = "#1a6b3c";

export default function SettingsScreen({ onSubScreen }) {
  const { data, currentUser, can, logout, showToast } = useApp();
  const { org, books, collections, members, logs } = data;
  const roleInfo = ROLES[currentUser?.role] || ROLES.viewer;
  const totalC = collections.reduce((s, c) => s + (c.amount || 0), 0);

  function Row({ icon, iconBg="#e8f5ee", iconColor=GREEN, label, value, onClick, danger, badge }) {
    return (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderBottom:"1px solid #f5f7f5", cursor:onClick?"pointer":"default" }}>
        <div style={{ width:34, height:34, borderRadius:9, background:danger?"#ffebee":iconBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <i className={`ti ${icon}`} style={{ color:danger?"#dc2626":iconColor, fontSize:16 }}/>
        </div>
        <span style={{ flex:1, fontSize:13, fontWeight:500, color:danger?"#dc2626":"#1a1a1a" }}>{label}</span>
        {badge && <span style={{ fontSize:10, fontWeight:700, background:"#e8f5ee", color:GREEN, padding:"2px 8px", borderRadius:8 }}>{badge}</span>}
        {value && <span style={{ fontSize:12, color:"#aaa" }}>{value}</span>}
        {onClick && <i className="ti ti-chevron-right" style={{ color:"#ccc", fontSize:14 }}/>}
      </div>
    );
  }

  function Section({ title, children }) {
    return (
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:7, paddingLeft:2 }}>{title}</div>
        <div style={{ background:"#fff", borderRadius:13, border:"1px solid #eee", overflow:"hidden" }}>
          {children}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background:"#f5f7f5", padding:"10px 12px 24px" }}>

      {/* Profile banner */}
      <div style={{ background:`linear-gradient(135deg,${GREEN},#2e7d32)`, borderRadius:14, padding:"14px 16px", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:50, height:50, borderRadius:14, background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:22, fontWeight:700, flexShrink:0 }}>
            {currentUser?.name?.[0]?.toUpperCase()||"?"}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:"#fff", fontSize:15, fontWeight:700 }}>{currentUser?.name}</div>
            <div style={{ color:"rgba(255,255,255,0.7)", fontSize:11, marginTop:2 }}>{currentUser?.email}</div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:9, padding:"5px 12px", color:"#fff", fontSize:11, fontWeight:700 }}>
            {roleInfo.label}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginTop:12 }}>
          {[
            { l:"Collected", v:fmt(totalC).replace("Rs.","₹") },
            { l:"Members",   v:members.length },
            { l:"Books",     v:`${books.length}/500` },
            { l:"Complete",  v:books.filter(b=>b.status==="complete").length },
          ].map((s,i)=>(
            <div key={i} style={{ background:"rgba(255,255,255,0.15)", borderRadius:8, padding:"6px 8px", textAlign:"center" }}>
              <div style={{ color:"rgba(255,255,255,0.6)", fontSize:8 }}>{s.l}</div>
              <div style={{ color:"#fff", fontSize:12, fontWeight:700, marginTop:1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Super admin tools */}
      {can.manageUsers() && (
        <Section title="Super admin">
          <Row icon="ti-users-group" iconBg="#e3f2fd" iconColor="#1565c0" label="User management" badge={`${(data.appUsers||[]).length||0} users`} onClick={()=>onSubScreen("users")}/>
          <Row icon="ti-activity"    iconBg="#f3e5f5" iconColor="#6a1b9a" label="Activity log"     badge={`${logs?.length||0} entries`} onClick={()=>onSubScreen("logs")}/>
        </Section>
      )}

      {/* App info */}
      <Section title="Organisation">
        <Row icon="ti-building-community" label="Name"       value={org.name.split("&")[0].trim()}/>
        <Row icon="ti-id-badge"           iconBg="#e3f2fd" iconColor="#1565c0" label="Reg. No."  value={org.reg}/>
        <Row icon="ti-ticket"             iconBg="#fff3e0" iconColor="#e65100" label="Ticket price" value="Rs.1,000"/>
      </Section>

      {/* Your permissions */}
      <Section title="Your access">
        <div style={{ padding:"12px 14px" }}>
          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
            {[
              { label:"View app",       ok:true },
              { label:"Collect cash",   ok:can.collectCash() },
              { label:"Add members",    ok:can.addMember() },
              { label:"Delete members", ok:can.deleteMember() },
              { label:"Assign books",   ok:can.assignBook() },
              { label:"Reports",        ok:can.viewReports() },
              { label:"PDF export",     ok:can.downloadPDF() },
              { label:"Activity log",   ok:can.viewLogs() },
              { label:"Manage users",   ok:can.manageUsers() },
            ].map((p,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:4, background:p.ok?"#e8f5ee":"#f5f5f5", borderRadius:7, padding:"4px 9px" }}>
                <i className={`ti ${p.ok?"ti-check":"ti-x"}`} style={{ fontSize:11, color:p.ok?GREEN:"#ccc" }}/>
                <span style={{ fontSize:10, color:p.ok?GREEN:"#bbb", fontWeight:p.ok?600:400 }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="App">
        <Row icon="ti-code" iconBg="#f5f5f5" iconColor="#555" label="Version" value="v5.0"/>
        <Row icon="ti-download" iconBg="#e3f2fd" iconColor="#1565c0" label="Export all data" onClick={()=>showToast("Data exported")}/>
      </Section>

      <Section title="Account">
        <Row icon="ti-logout" label="Sign out" onClick={logout} danger/>
      </Section>

      <div style={{ textAlign:"center", fontSize:10, color:"#ccc", marginTop:8, lineHeight:1.8 }}>
        NBC Coupon Sale App · Mega Lucky Draw 2026<br/>
        Niranam Chudan Vallasamithi & NBC
      </div>
    </div>
  );
}
