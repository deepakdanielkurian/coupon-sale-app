import { useApp } from "../data/AppContext";
import { fmt } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

export default function SettingsScreen() {
  const { data, showToast } = useApp();
  const { org, books, collections, members } = data;
  const totalCollected = collections.reduce((s, c) => s + c.amount, 0);

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>

      {/* Org card */}
      <div style={{ background: RED, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Organization</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>{org.name}</div>
        <div style={{ fontSize: 10, color: GOLD, marginTop: 3 }}>{org.reg}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{org.event}</div>
        <div style={{ marginTop: 10, background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Grand prize</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>{org.grandPrize}</div>
            <div style={{ fontSize: 10, color: GOLD }}>{org.sponsor}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Ticket price</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: GOLD }}>₹1,000</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        {[
          ["Total collected", fmt(totalCollected), "#3B6D11"],
          ["Members", members.length, "#2C2C2A"],
          ["Books issued", books.length, "#2C2C2A"],
          ["Books complete", books.filter(b => b.status === "complete").length, "#3B6D11"],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>{l}</div>
            <div style={{ fontSize: 17, fontWeight: 500, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* App info */}
      {[
        { section: "App", items: [
          { icon: "ti-info-circle", label: "App version", value: "v1.0.0" },
          { icon: "ti-building-community", label: "Organization", value: org.name },
          { icon: "ti-user-shield", label: "Role", value: "Super Admin (Coordinator)" },
        ]},
        { section: "Data", items: [
          { icon: "ti-users", label: "Total members", value: members.length },
          { icon: "ti-ticket", label: "Total books", value: books.length },
          { icon: "ti-cash", label: "Ticket price", value: "₹1,000 (fixed)" },
        ]},
        { section: "Actions", items: [
          { icon: "ti-download", label: "Export all data", action: () => showToast("Data exported") },
          { icon: "ti-file-text", label: "Download all reports", action: () => showToast("All reports downloaded") },
          { icon: "ti-refresh", label: "Refresh data", action: () => showToast("Data refreshed") },
        ]},
      ].map(group => (
        <div key={group.section} style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#854F0B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>{group.section}</div>
          <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
            {group.items.map((item, i) => (
              <div key={item.label} onClick={item.action} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderBottom: i < group.items.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none", cursor: item.action ? "pointer" : "default" }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: "#f7f4f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className={`ti ${item.icon}`} style={{ color: RED, fontSize: 15 }} />
                </div>
                <span style={{ flex: 1, fontSize: 13, color: "#2C2C2A" }}>{item.label}</span>
                {item.value !== undefined && <span style={{ fontSize: 12, color: "#888780" }}>{item.value}</span>}
                {item.action && <i className="ti ti-chevron-right" style={{ color: "#ccc", fontSize: 14 }} />}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ textAlign: "center", fontSize: 11, color: "#888780", marginTop: 8, lineHeight: 1.6 }}>
        Coupon Sale App · {org.name}<br />
        Built for Mega Lucky Draw 2026
      </div>
    </div>
  );
}
