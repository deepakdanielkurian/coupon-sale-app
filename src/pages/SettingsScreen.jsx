import { useApp } from "../data/AppContext";
import { ROLES } from "../data/store";
import { fmt } from "../data/store";

const GREEN="#1a6b3c";

export default function SettingsScreen({ onNavigate }) {
  const { data, currentUser, can, logout, showToast } = useApp();
  const { org, books, collections, members } = data;
  const roleInfo = ROLES[currentUser?.role]||ROLES.viewer;
  const totalC = collections.reduce((s,c)=>s+(c.amount||0),0);

  function Section({ title, children }) {
    return (
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,color:"#888",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:7,paddingLeft:2}}>{title}</div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid #eee",overflow:"hidden"}}>
          {children}
        </div>
      </div>
    );
  }

  function Row({ icon, iconBg, iconColor="#1a6b3c", label, value, onClick, danger }) {
    return (
      <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderBottom:"1px solid #f5f5f5",cursor:onClick?"pointer":"default",background:danger?"#fff5f5":"transparent"}} >
        <div style={{width:32,height:32,borderRadius:8,background:iconBg||"#e8f5ee",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <i className={`ti ${icon}`} style={{color:iconColor,fontSize:15}}/>
        </div>
        <span style={{flex:1,fontSize:13,color:danger?"#dc2626":"#1a1a1a",fontWeight:500}}>{label}</span>
        {value&&<span style={{fontSize:12,color:"#aaa"}}>{value}</span>}
        {onClick&&<i className="ti ti-chevron-right" style={{color:"#ccc",fontSize:14}}/>}
      </div>
    );
  }

  return (
    <div style={{background:"#f5f7f5",padding:"10px 12px 20px"}}>

      {/* Profile card */}
      <div style={{background:`linear-gradient(135deg,${GREEN},#2e7d32)`,borderRadius:14,padding:"14px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:48,height:48,borderRadius:14,background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:22,fontWeight:700,flexShrink:0}}>
          {currentUser?.name?.[0]||"?"}
        </div>
        <div style={{flex:1}}>
          <div style={{color:"#fff",fontSize:15,fontWeight:700}}>{currentUser?.name}</div>
          <div style={{color:"rgba(255,255,255,0.7)",fontSize:11,marginTop:2}}>{currentUser?.email}</div>
        </div>
        <div style={{background:"rgba(255,255,255,0.2)",borderRadius:8,padding:"4px 10px",color:"#fff",fontSize:11,fontWeight:700}}>{roleInfo.label}</div>
      </div>

      {/* Quick stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
        {[
          {l:"Total collected",v:fmt(totalC),c:GREEN},
          {l:"Members",v:members.length,c:"#1a1a1a"},
          {l:"Books assigned",v:`${books.length}/500`,c:"#1a1a1a"},
          {l:"Books complete",v:books.filter(b=>b.status==="complete").length,c:GREEN},
        ].map((s,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:9,border:"1px solid #eee",padding:"9px 10px"}}>
            <div style={{fontSize:10,color:"#aaa"}}>{s.l}</div>
            <div style={{fontSize:16,fontWeight:700,color:s.c,marginTop:2}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Permissions overview */}
      <Section title="Your access level">
        <div style={{padding:"12px 14px"}}>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {[
              {label:"View app",    ok:true},
              {label:"Add member",  ok:can.addMember()},
              {label:"Edit member", ok:can.editMember()},
              {label:"Delete member",ok:can.deleteMember()},
              {label:"Assign book", ok:can.assignBook()},
              {label:"Collect cash",ok:can.collectCash()},
              {label:"View reports",ok:can.viewReports()},
              {label:"Download PDF",ok:can.downloadPDF()},
              {label:"View logs",   ok:can.viewLogs()},
            ].map((p,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:4,background:p.ok?"#e8f5ee":"#f5f5f5",borderRadius:6,padding:"4px 8px"}}>
                <i className={`ti ${p.ok?"ti-check":"ti-x"}`} style={{fontSize:11,color:p.ok?GREEN:"#ccc"}}/>
                <span style={{fontSize:10,color:p.ok?GREEN:"#bbb",fontWeight:p.ok?600:400}}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="App">
        <Row icon="ti-building-community" iconBg="#e8f5ee" label="Organisation" value={org.name.split("&")[0].trim()}/>
        <Row icon="ti-id-badge" iconBg="#e3f2fd" iconColor="#1565c0" label="Reg. number" value={org.reg}/>
        <Row icon="ti-ticket" iconBg="#fff3e0" iconColor="#e65100" label="Ticket price" value="Rs.1,000 (fixed)"/>
        <Row icon="ti-info-circle" iconBg="#f3e5f5" iconColor="#4a148c" label="App version" value="v4.0"/>
      </Section>

      {can.viewLogs() && (
        <Section title="Admin tools">
          <Row icon="ti-activity" iconBg="#e8f5ee" label="Activity log" value={`${data.logs?.length||0} entries`} onClick={()=>onNavigate("logs")}/>
          <Row icon="ti-download" iconBg="#e3f2fd" iconColor="#1565c0" label="Export all data" onClick={()=>showToast("Data exported")}/>
        </Section>
      )}

      <Section title="Account">
        <Row icon="ti-logout" iconBg="#ffebee" iconColor="#dc2626" label="Sign out" onClick={logout} danger/>
      </Section>

      <div style={{textAlign:"center",fontSize:10,color:"#ccc",marginTop:10}}>
        NBC Coupon Sale App · Mega Lucky Draw 2026
      </div>
    </div>
  );
}
