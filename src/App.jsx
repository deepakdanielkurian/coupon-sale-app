import { useState } from "react";
import { AppProvider, useApp } from "./data/AppContext";
import { ROLES } from "./data/store";
import LoginScreen       from "./pages/LoginScreen";
import HomeScreen        from "./pages/HomeScreen";
import MembersScreen     from "./pages/MembersScreen";
import BooksScreen       from "./pages/BooksScreen";
import ReportsScreen     from "./pages/ReportsScreen";
import SettingsScreen    from "./pages/SettingsScreen";
import ActivityLogScreen from "./pages/ActivityLogScreen";
import UserManagementScreen from "./pages/UserManagementScreen";

const GREEN = "#1a6b3c";

function StatusBar() {
  const { currentUser } = useApp();
  const roleInfo = ROLES[currentUser?.role] || ROLES.viewer;
  return (
    <div style={{ background:GREEN, padding:"8px 14px 6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ color:"rgba(255,255,255,0.85)", fontSize:11 }}>
        {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
      </span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ background:"rgba(255,255,255,0.18)", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 8px", borderRadius:10, letterSpacing:"0.2px" }}>
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
  ].filter(item => !item.gate || can[item.gate]?.());

  return (
    <div style={{ background:"#fff", borderTop:"1px solid #eee", display:"flex", padding:"5px 0 10px", boxShadow:"0 -2px 10px rgba(0,0,0,0.05)" }}>
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
  const [subScreen, setSub]  = useState(null); // "logs" | "users"

  if (!currentUser) return <LoginScreen/>;

  function navigate(key) {
    if (key==="reports" && !can.viewReports()) return;
    setSub(null);
    setActive(key);
  }

  // Sub-screens (overlay within settings)
  if (subScreen==="logs" && can.viewLogs())    return <div style={{display:"flex",flexDirection:"column",height:"100vh",maxWidth:420,margin:"0 auto"}}><StatusBar/><ActivityLogScreen onBack={()=>setSub(null)}/><BottomNav active="settings" onNavigate={navigate}/></div>;
  if (subScreen==="users" && can.manageUsers())return <div style={{display:"flex",flexDirection:"column",height:"100vh",maxWidth:420,margin:"0 auto"}}><StatusBar/><UserManagementScreen onBack={()=>setSub(null)}/><BottomNav active="settings" onNavigate={navigate}/></div>;

  const fullScreen = ["books","members","reports"];
  const screen = {
    home:     <HomeScreen onNavigate={navigate}/>,
    books:    <BooksScreen/>,
    members:  <MembersScreen/>,
    reports:  can.viewReports() ? <ReportsScreen/> : <HomeScreen onNavigate={navigate}/>,
    settings: <SettingsScreen onNavigate={navigate} onSubScreen={setSub}/>,
  }[active] || <HomeScreen onNavigate={navigate}/>;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", maxWidth:420, margin:"0 auto", background:"#f5f7f5", fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <StatusBar/>
      {fullScreen.includes(active)
        ? <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>{screen}</div>
        : <div style={{flex:1,overflowY:"auto"}}>{screen}</div>
      }
      <BottomNav active={active} onNavigate={navigate}/>
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner/></AppProvider>;
}
