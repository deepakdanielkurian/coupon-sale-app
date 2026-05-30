import { useState } from "react";
import { AppProvider } from "./data/AppContext";
import HomeScreen from "./pages/HomeScreen";
import MembersScreen from "./pages/MembersScreen";
import BooksScreen from "./pages/BooksScreen";
import ReportsScreen from "./pages/ReportsScreen";
import SettingsScreen from "./pages/SettingsScreen";
import { BottomNav } from "./components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

function StatusBar() {
  return (
    <div style={{ background: RED, padding: "8px 14px 6px", display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
        {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>●●●</span>
    </div>
  );
}

function TabHeader({ active }) {
  const titles = {
    home: { title: "Niranam Chudan Vallasamithi", sub: "Mega Lucky Draw 2026 · Coordinator" },
    books: { title: "Coupon books", sub: "₹1,000 per ticket" },
    members: { title: "Members", sub: "Registered sellers" },
    reports: { title: "Reports", sub: "Coordinator access" },
    settings: { title: "Settings", sub: "App configuration" },
  };
  const t = titles[active] || titles.home;

  const showTabs = ["home"].includes(active);
  return (
    <>
      <div style={{ background: RED, padding: "10px 14px 12px" }}>
        {active === "home" && <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.3px", marginBottom: 2 }}>Niranam Chudan Vallasamithi &amp; NBC · Reg. PTM/TC/105/2022</div>}
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{t.title}</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>{t.sub}</div>
      </div>
      {showTabs && (
        <div style={{ background: "#6B0000", display: "flex" }}>
          {[["Summary", "home_summary"], ["Books", "home_books"], ["Members", "home_members"]].map(([l, k]) => (
            <div key={k} style={{ flex: 1, textAlign: "center", padding: "7px 2px", color: k === "home_summary" ? GOLD : "rgba(255,255,255,0.5)", fontSize: 10, borderBottom: k === "home_summary" ? `2px solid ${GOLD}` : "2px solid transparent" }}>{l}</div>
          ))}
        </div>
      )}
    </>
  );
}

function AppInner() {
  const [active, setActive] = useState("home");

  const screens = {
    home: HomeScreen,
    books: BooksScreen,
    members: MembersScreen,
    reports: ReportsScreen,
    settings: SettingsScreen,
  };

  const Screen = screens[active];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: 420, margin: "0 auto", background: "#f7f4f0", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <StatusBar />
      {/* Pages that manage their own header */}
      {["books", "members", "reports"].includes(active) ? (
        <Screen onNavigate={setActive} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }} />
      ) : (
        <>
          <TabHeader active={active} />
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <Screen onNavigate={setActive} />
          </div>
        </>
      )}
      <BottomNav active={active} onNavigate={setActive} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
