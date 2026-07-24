import { useState } from "react";
import { AppProvider, useApp } from "./data/AppContext";
import { ROLES } from "./data/store";
import LoginScreen          from "./pages/LoginScreen";
import HomeScreen           from "./pages/HomeScreen";
import MembersScreen        from "./pages/MembersScreen";
import BooksScreen          from "./pages/BooksScreen";
import ReportsScreen        from "./pages/ReportsScreen";
import SettingsScreen       from "./pages/SettingsScreen";
import ActivityLogScreen    from "./pages/ActivityLogScreen";
import UserManagementScreen from "./pages/UserManagementScreen";
import BackupScreen         from "./pages/BackupScreen";
import RemittanceScreen     from "./pages/RemittanceScreen";
import ShareholdersScreen from "./pages/ShareholdersScreen";

const GREEN = "#1a6b3c";

// ── Force password change on first login ─────────────────────
function MustChangePassword() {
  const { currentUser, appUsers, updateUser, showToast } = useApp();
  const [pw, setPw]   = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow]= useState(false);
  const [saving, setSaving] = useState(false);

  async function handleChange(e) {
    e.preventDefault();
    if (pw.length < 6)  { showToast("Minimum 6 characters", "error"); return; }
    if (pw !== pw2)     { showToast("Passwords do not match", "error"); return; }
    setSaving(true);
    await updateUser(currentUser.id, { password: pw, mustChangePassword: false });
    showToast("Password changed! Please log in again.");
    setTimeout(() => window.location.reload(), 1500);
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#e8f5ee,#fff)", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ width:"100%", maxWidth:360, background:"#fff", borderRadius:18, boxShadow:"0 8px 40px rgba(0,0,0,0.08)", padding:"28px 24px" }}>
        <div style={{ width:52, height:52, borderRadius:14, background:`linear-gradient(135deg,${GREEN},#2e7d32)`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
          <i className="ti ti-lock-open" style={{ color:"#fff", fontSize:26 }}/>
        </div>
        <div style={{ fontSize:17, fontWeight:700, color:"#1a1a1a", textAlign:"center", marginBottom:6 }}>Set your password</div>
        <div style={{ fontSize:12, color:"#888", textAlign:"center", marginBottom:22, lineHeight:1.5 }}>
          This is your first login. Please set a new secure password before continuing.
        </div>
        <form onSubmit={handleChange}>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:5 }}>New password</div>
            <div style={{ position:"relative" }}>
              <input type={show?"text":"password"} value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min 6 characters"
                style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${pw?GREEN:"#e0e0e0"}`, borderRadius:9, padding:"10px 36px 10px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
              <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#aaa" }}>
                <i className={`ti ${show?"ti-eye-off":"ti-eye"}`} style={{ fontSize:15 }}/>
              </button>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:600, color:"#555", marginBottom:5 }}>Confirm password</div>
            <input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Repeat new password"
              style={{ width:"100%", background:"#f8faf8", border:`1.5px solid ${pw2&&pw2===pw?GREEN:pw2?"#dc2626":"#e0e0e0"}`, borderRadius:9, padding:"10px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
            {pw2 && pw !== pw2 && <div style={{ fontSize:10, color:"#dc2626", marginTop:3 }}>Passwords do not match</div>}
          </div>
          <button type="submit" disabled={saving}
            style={{ width:"100%", background:saving?"#ccc":`linear-gradient(135deg,${GREEN},#2e7d32)`, color:"#fff", border:"none", borderRadius:10, padding:12, fontSize:14, fontWeight:700, cursor:saving?"not-allowed":"pointer", boxShadow:saving?"none":"0 4px 14px rgba(26,107,60,0.3)" }}>
            {saving ? "Saving..." : "Set password & continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function StatusBar() {
  const { currentUser } = useApp();
  const roleInfo = ROLES[currentUser?.role] || ROLES.viewer;
  return (
    <div style={{ background:GREEN, padding:"max(8px, env(safe-area-inset-top)) 14px 6px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
      <span style={{ color:"rgba(255,255,255,0.85)", fontSize:11 }}>
        {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
      </span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ background:"rgba(255,255,255,0.18)", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>
          {roleInfo.label.toUpperCase()}
        </span>
        <span style={{ color:"rgba(255,255,255,0.7)", fontSize:11 }}>●●●</span>
      </div>
    </div>
  );
}

function BottomNav({ active, onNavigate }) {
  const { can } = useApp();
  const items = [
    { key:"home",    icon:"ti-home",      label:"Home"    },
    { key:"books",   icon:"ti-ticket",    label:"Books"   },
    { key:"members", icon:"ti-users",     label:"Members" },
    { key:"reports", icon:"ti-chart-bar", label:"Reports", gate:"viewReports" },
    { key:"settings",icon:"ti-settings",  label:"More"    },
  ].filter(i => !i.gate || can[i.gate]?.());

  return (
    <div style={{ background:"#fff", borderTop:"1px solid #eee", display:"flex", padding:"5px 0 max(10px, env(safe-area-inset-bottom))", boxShadow:"0 -2px 10px rgba(0,0,0,0.05)", flexShrink:0, position:"relative", zIndex:50 }}>
      {items.map(item => (
        <button key={item.key} onClick={()=>onNavigate(item.key)}
          style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:active===item.key?GREEN:"#bbb", fontSize:9, background:"none", border:"none", cursor:"pointer", padding:"2px 0" }}>
          <i className={`ti ${item.icon}`} style={{ fontSize:21, opacity:active===item.key?1:0.55 }}/>
          <span style={{ fontWeight:active===item.key?700:400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function AppInner() {
  const { currentUser, can } = useApp();
  const [active, setActive]  = useState("home");
  const [sub, setSub]        = useState(null); // logs | users | backup | remittance | shareholders

  if (!currentUser) return <LoginScreen/>;

  // Force password change on first login
  if (currentUser.mustChangePassword) return <MustChangePassword/>;

  function navigate(key) {
    if (key==="reports" && !can.viewReports()) return;
    setSub(null); setActive(key);
  }

  // Sub-screens (full page overlays)
  const subScreenWrap = (child) => (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:420, margin:"0 auto" }}>
      <StatusBar/><div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>{child}</div><BottomNav active="settings" onNavigate={navigate}/>
    </div>
  );
  if (sub==="logs"   && can.viewLogs())    return subScreenWrap(<ActivityLogScreen    onBack={()=>setSub(null)}/>);
  if (sub==="users"  && can.manageUsers()) return subScreenWrap(<UserManagementScreen onBack={()=>setSub(null)}/>);
  if (sub==="backup"     && can.manageUsers()) return subScreenWrap(<BackupScreen         onBack={()=>setSub(null)}/>);
  if (sub==="remittance" && can.manageUsers()) return subScreenWrap(<RemittanceScreen    onBack={()=>setSub(null)}/>);
  if (sub==="shareholders")                   return subScreenWrap(<ShareholdersScreen  onBack={()=>setSub(null)}/>);

  const fullScreen = ["books","members","reports"];
  const screens = {
    home:     <HomeScreen     onNavigate={navigate}/>,
    books:    <BooksScreen/>,
    members:  <MembersScreen/>,
    reports:  can.viewReports() ? <ReportsScreen/> : <HomeScreen onNavigate={navigate}/>,
    settings: <SettingsScreen onSubScreen={setSub}/>,
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", maxWidth:420, margin:"0 auto", background:"#f5f7f5", fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <StatusBar/>
      {fullScreen.includes(active)
        ? <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:0 }}>{screens[active]}</div>
        : <div style={{ flex:1, overflowY:"auto", minHeight:0 }}>{screens[active]}</div>
      }
      <BottomNav active={active} onNavigate={navigate}/>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner/></AppProvider>;
}
