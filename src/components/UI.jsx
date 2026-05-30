import { LABELS } from "../data/store";

const RED = "#8B0000";
const GOLD = "#FFD700";

export function Badge({ label, type = "committee_member" }) {
  const cfg = LABELS[type] || LABELS.committee_member;
  return (
    <span style={{ display: "inline-block", fontSize: 9, padding: "2px 7px", borderRadius: 8, fontWeight: 500, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cfg = {
    complete: { bg: "#EAF3DE", color: "#3B6D11", label: "Complete" },
    ongoing: { bg: "#FAEEDA", color: "#854F0B", label: "Ongoing" },
    not_started: { bg: "#FCEBEB", color: "#A32D2D", label: "Not started" },
  }[status] || { bg: "#f0ede8", color: "#888780", label: status };
  return (
    <span style={{ display: "inline-block", fontSize: 9, padding: "2px 7px", borderRadius: 8, fontWeight: 500, background: cfg.bg, color: cfg.color }}>
      {cfg.label}
    </span>
  );
}

export function Avatar({ name, size = 36, bg = "#FCEBEB", color = "#791F1F" }) {
  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.33, fontWeight: 500, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "9px 12px", marginBottom: 8, cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: "#854F0B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px", margin: "12px 0 6px" }}>
      {children}
    </div>
  );
}

export function ProgressBar({ value, max, color = "#639922" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ flex: 1, height: 8, background: "#f0ede8", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }} />
    </div>
  );
}

export function StatGrid({ stats }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#888780" }}>{s.label}</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: s.color || "#2C2C2A", marginTop: 2 }}>{s.value}</div>
        </div>
      ))}
    </div>
  );
}

export function InfoChip({ children, type = "warn" }) {
  const cfg = {
    warn: { bg: "#FAEEDA", color: "#633806", icon: "ti-info-circle", ic: "#854F0B" },
    success: { bg: "#EAF3DE", color: "#27500A", icon: "ti-circle-check", ic: "#3B6D11" },
    error: { bg: "#FCEBEB", color: "#791F1F", icon: "ti-alert-circle", ic: "#A32D2D" },
  }[type];
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, background: cfg.bg, borderRadius: 8, padding: "7px 10px", marginBottom: 10 }}>
      <i className={`ti ${cfg.icon}`} style={{ color: cfg.ic, fontSize: 14, flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 11, color: cfg.color, lineHeight: 1.4 }}>{children}</span>
    </div>
  );
}

export function ScreenHeader({ title, sub, onBack, org = false }) {
  return (
    <div style={{ background: RED, padding: "10px 14px 12px" }}>
      {org && <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.3px", marginBottom: 2 }}>Niranam Chudan Vallasamithi &amp; NBC</div>}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {onBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}>
            <i className="ti ti-arrow-left" />
          </button>
        )}
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>{title}</div>
          {sub && <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export function BottomNav({ active, onNavigate }) {
  const items = [
    { key: "home", icon: "ti-home", label: "Home" },
    { key: "books", icon: "ti-ticket", label: "Books" },
    { key: "members", icon: "ti-users", label: "Members" },
    { key: "reports", icon: "ti-chart-bar", label: "Reports" },
    { key: "settings", icon: "ti-settings", label: "Settings" },
  ];
  return (
    <div style={{ background: "#fff", borderTop: "0.5px solid rgba(0,0,0,0.1)", display: "flex", padding: "6px 0 10px" }}>
      {items.map(item => (
        <button key={item.key} onClick={() => onNavigate(item.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, color: active === item.key ? RED : "#888780", fontSize: 9, background: "none", border: "none", cursor: "pointer", padding: "2px 0" }}>
          <i className={`ti ${item.icon}`} style={{ fontSize: 19 }} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, style = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", background: disabled ? "#ccc" : RED, color: disabled ? "#fff" : GOLD, border: "none", borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", marginTop: 4, ...style }}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, style = {} }) {
  return (
    <button onClick={onClick} style={{ width: "100%", background: "#fff", color: RED, border: `0.5px solid ${RED}`, borderRadius: 10, padding: "10px", fontSize: 12, cursor: "pointer", marginTop: 6, ...style }}>
      {children}
    </button>
  );
}

export function InputField({ label, value, onChange, placeholder, type = "text", disabled, required, error }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>{label}{required && " *"}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange && onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%", background: disabled ? "#f0ede8" : "#fff",
          border: `0.5px solid ${error ? "#E24B4A" : value ? RED : "rgba(0,0,0,0.15)"}`,
          borderRadius: 8, padding: "9px 11px", fontSize: 13,
          color: disabled ? "#888780" : "#2C2C2A",
          outline: "none", boxSizing: "border-box",
        }}
      />
      {error && <div style={{ fontSize: 10, color: "#A32D2D", marginTop: 3 }}>{error}</div>}
    </div>
  );
}

export function SelectField({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>{label}{required && " *"}</div>
      <select value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", background: "#fff", border: `0.5px solid ${value ? RED : "rgba(0,0,0,0.15)"}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", outline: "none", boxSizing: "border-box" }}>
        <option value="">— select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function fmt(num) {
  return "₹" + Number(num).toLocaleString("en-IN");
}
