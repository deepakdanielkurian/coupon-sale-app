import { useApp } from "../data/AppContext";
import { getBookStats, getMemberStats } from "../data/store";
import { Card, SectionLabel, StatusBadge, Avatar, fmt, ProgressBar } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

export default function HomeScreen({ onNavigate }) {
  const { data } = useApp();
  const { books, collections, members, org } = data;

  const totalCollected = collections.reduce((s, c) => s + c.amount, 0);
  const totalValue = books.reduce((s, b) => s + b.ticketCount * 1000, 0);
  const totalPending = totalValue - totalCollected;
  const completeBooks = books.filter(b => b.status === "complete").length;
  const allTickets = books.reduce((s, b) => s + b.ticketCount, 0);
  const soldTickets = collections.reduce((s, c) => s + c.ticketsSold, 0);

  const recent = [...collections].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 4px" }}>
      {/* Grand prize banner */}
      <div style={{ background: RED, borderRadius: 10, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
        <i className="ti ti-trophy" style={{ color: GOLD, fontSize: 24, flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)" }}>Grand prize · {org.sponsor}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{org.grandPrize}</div>
          <div style={{ fontSize: 10, color: GOLD }}>₹1,000 per ticket</div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Draw 2026</div>
          <div style={{ fontSize: 18, fontWeight: 500, color: GOLD }}>{allTickets}</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>total tickets</div>
        </div>
      </div>

      {/* Stats */}
      <SectionLabel>Collection overview</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[
          { label: "Total collected", value: fmt(totalCollected), color: "#3B6D11" },
          { label: "Pending balance", value: fmt(totalPending), color: "#854F0B" },
          { label: "Books issued", value: `${books.length}`, color: "#2C2C2A" },
          { label: "Books complete", value: `${completeBooks} / ${books.length}`, color: "#3B6D11" },
          { label: "Tickets sold", value: `${soldTickets} / ${allTickets}`, color: "#2C2C2A" },
          { label: "Members", value: `${members.length}`, color: "#2C2C2A" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>{s.label}</div>
            <div style={{ fontSize: 16, fontWeight: 500, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 8 }}>Overall sale progress</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ProgressBar value={soldTickets} max={allTickets} color={soldTickets / allTickets > 0.7 ? "#639922" : "#EF9F27"} />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", minWidth: 32 }}>{Math.round((soldTickets / allTickets) * 100)}%</span>
        </div>
        <div style={{ fontSize: 10, color: "#888780" }}>{soldTickets} of {allTickets} tickets sold · {fmt(totalCollected)} of {fmt(totalValue)}</div>
      </Card>

      {/* Pending alert */}
      {totalPending > 0 && (
        <div style={{ background: "#FAEEDA", borderRadius: 8, padding: "8px 10px", marginBottom: 8, display: "flex", gap: 7 }}>
          <i className="ti ti-alert-triangle" style={{ color: "#854F0B", fontSize: 14, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: "#633806" }}>
            {fmt(totalPending)} pending from {books.filter(b => b.status !== "complete").length} active books. Tap Books to follow up.
          </span>
        </div>
      )}

      {/* Recent collections */}
      <SectionLabel>Recent collections</SectionLabel>
      {recent.map(col => {
        const book = books.find(b => b.id === col.bookId);
        const member = members.find(m => m.id === col.memberId);
        if (!member) return null;
        return (
          <Card key={col.id} onClick={() => onNavigate("books")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={`${member.firstName} ${member.lastName}`} bg="#EAF3DE" color="#27500A" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{member.firstName} {member.lastName}</div>
                <div style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>Book {book?.bookNumber} · {col.date} · {col.paymentMode}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#3B6D11" }}>{fmt(col.amount)}</div>
                <div style={{ fontSize: 10, color: "#888780" }}>{col.ticketsSold} tickets</div>
              </div>
            </div>
          </Card>
        );
      })}

      <button onClick={() => onNavigate("books")} style={{ width: "100%", background: RED, color: GOLD, border: "none", borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 500, cursor: "pointer", marginTop: 4, marginBottom: 8 }}>
        <i className="ti ti-plus" /> Record new collection
      </button>
    </div>
  );
}
