import { useState } from "react";
import { AppProvider, useApp } from "./data/AppContext";
import { ROLES } from "./data/store";
import LoginScreen from "./pages/LoginScreen";
import HomeScreen from "./pages/HomeScreen";
import MembersScreen from "./pages/MembersScreen";
import BooksScreen from "./pages/BooksScreen";
import ReportsScreen from "./pages/ReportsScreen";
import SettingsScreen from "./pages/SettingsScreen";
import ActivityLogScreen from "./pages/ActivityLogScreen";

// ── Light theme tokens ────────────────────────────────────────
const T = {
  primary:   "#1a6b3c",
  primary2:  "#2e7d32",
  accent:    "#e8f5ee",
  bg:        "#f5f7f5",
  card:      "#ffffff",
  border:    "#e8ece8",
  text:      "#1a1a1a",
  muted:     "#777",
  danger:    "#c62828",
  amber:     "#e65100",
  blue:      "#1565c0",
};

function StatusBar() {
  const { currentUser } = useApp();
  const roleInfo = ROLES[currentUser?.role] || ROLES.viewer;
  return (
    <div style={{ background:T.primary, padding:"8px 14px 6px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ color:"rgba(255,255,255,0.85)", fontSize:11 }}>
        {new Date().toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
      </span>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ background:"rgba(255,255,255,0.15)", color:"#fff", fontSize:9, fontWeight:600, padding:"2px 8px", borderRadius:10 }}>{roleInfo.label}</span>
        <span style={{ color:"rgba(255,255,255,0.8)", fontSize:11 }}>●●●</span>
      </div>
    </div>
  );
}

function BottomNav({ active, onNavigate }) {
  const { can, currentUser } = useApp();
  const items = [
    { key:"home",    icon:"ti-home",      label:"Home",    always:true },
    { key:"books",   icon:"ti-ticket",    label:"Books",   always:true },
    { key:"members", icon:"ti-users",     label:"Members", always:true },
    { key:"reports", icon:"ti-chart-bar", label:"Reports", check:"viewReports" },
    { key:"settings",icon:"ti-settings",  label:"More",    always:true },
  ].filter(item => item.always || can[item.check]?.());

  return (
    <div style={{ background:"#fff", borderTop:`1px solid ${T.border}`, display:"flex", padding:"5px 0 10px", boxShadow:"0 -2px 12px rgba(0,0,0,0.06)" }}>
      {items.map(item => (
        <button key={item.key} onClick={()=>onNavigate(item.key)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:2, color:active===item.key?T.primary:"#aaa", fontSize:9, background:"none", border:"none", cursor:"pointer", padding:"2px 0", transition:"color 0.2s" }}>
          <i className={`ti ${item.icon}`} style={{ fontSize:20, opacity:active===item.key?1:0.6 }} />
          <span style={{ fontWeight:active===item.key?600:400 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function AppInner() {
  const { currentUser, can } = useApp();
  const [active, setActive] = useState("home");

  if (!currentUser) return <LoginScreen />;

  function navigate(key) {
    // Permission gate
    if (key==="reports" && !can.viewReports()) return;
    setActive(key);
  }

  const screenMap = {
    home:     <HomeScreen onNavigate={navigate} />,
    books:    <BooksScreen />,
    members:  <MembersScreen />,
    reports:  can.viewReports() ? <ReportsScreen /> : <HomeScreen onNavigate={navigate} />,
    settings: <SettingsScreen onNavigate={navigate} />,
    logs:     can.viewLogs() ? <ActivityLogScreen onBack={()=>setActive("settings")} /> : <HomeScreen onNavigate={navigate} />,
  };

  // Screens that manage their own full-height layout
  const fullHeight = ["books","members","reports","logs"];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", maxWidth:420, margin:"0 auto", background:T.bg, fontFamily:"system-ui,-apple-system,sans-serif" }}>
      <StatusBar />
      {fullHeight.includes(active) ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {screenMap[active]}
        </div>
      ) : (
        <>
          <div style={{ flex:1, overflowY:"auto" }}>
            {screenMap[active]}
          </div>
        </>
      )}
      <BottomNav active={active} onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>;
}
