import { useApp } from "../data/AppContext";
import { getBookStats, getMemberStats } from "../data/store";
import { BOOK_SERIES, TOTAL_TICKETS, TICKET_GLOBAL_START, TICKET_GLOBAL_END, getSeriesFromBook } from "../data/bookConfig";
import { Card, SectionLabel, StatusBadge, Avatar, fmt, ProgressBar } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

export default function HomeScreen({ onNavigate }) {
  const { data, loading } = useApp();
  const { books, collections, members, org } = data;

  const totalCollected = collections.reduce((s, c) => s + (c.amount || 0), 0);
  const totalValue = TOTAL_TICKETS * 1000;   // 10,000 × ₹1,000 = ₹1,00,00,000
  const totalPending = totalValue - totalCollected;
  const completeBooks = books.filter(b => b.status === "complete").length;
  const soldTickets = collections.reduce((s, c) => s + (c.ticketsSold || 0), 0);

  const recent = [...collections].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  if (loading) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f7f4f0" }}>
      <div style={{ textAlign: "center" }}>
        <i className="ti ti-loader-2" style={{ fontSize: 32, color: RED, animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 12, color: "#888780", marginTop: 8 }}>Loading data...</div>
      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 4px" }}>

      {/* Grand prize banner */}
      <div style={{ background: RED, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-trophy" style={{ color: GOLD, fontSize: 26, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Grand prize · {org.sponsor}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#fff" }}>{org.grandPrize}</div>
            <div style={{ fontSize: 10, color: GOLD, marginTop: 2 }}>Tickets 10001–20000 · ₹1,000 each</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: GOLD }}>10,000</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>total tickets</div>
          </div>
        </div>

        {/* Series pills */}
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {Object.entries(BOOK_SERIES).map(([key, s]) => (
            <div key={key} style={{ flex: 1, background: "rgba(255,255,255,0.12)", borderRadius: 7, padding: "5px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: GOLD }}>{key}</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)" }}>{s.totalBooks} books</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>{s.ticketsPerBook} tickets each</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <SectionLabel>Collection overview</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[
          { label: "Total collected", value: fmt(totalCollected), color: "#3B6D11" },
          { label: "Pending balance", value: fmt(totalPending), color: "#854F0B" },
          { label: "Books assigned", value: `${books.length} / 500`, color: "#2C2C2A" },
          { label: "Books complete", value: `${completeBooks} / ${books.length}`, color: "#3B6D11" },
          { label: "Tickets sold", value: `${soldTickets} / ${TOTAL_TICKETS}`, color: "#2C2C2A" },
          { label: "Members", value: `${members.length}`, color: "#2C2C2A" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 8 }}>Overall sale progress</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ProgressBar value={soldTickets} max={TOTAL_TICKETS} color={soldTickets / TOTAL_TICKETS > 0.7 ? "#639922" : "#EF9F27"} />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", minWidth: 32 }}>{Math.round((soldTickets / TOTAL_TICKETS) * 100)}%</span>
        </div>
        <div style={{ fontSize: 10, color: "#888780" }}>{soldTickets} of {TOTAL_TICKETS.toLocaleString()} tickets sold · {fmt(totalCollected)} of {fmt(totalValue)}</div>
      </Card>

      {/* Pending alert */}
      {totalPending > 0 && books.filter(b => b.status !== "complete").length > 0 && (
        <div style={{ background: "#FAEEDA", borderRadius: 8, padding: "8px 10px", marginBottom: 8, display: "flex", gap: 7 }}>
          <i className="ti ti-alert-triangle" style={{ color: "#854F0B", fontSize: 14, flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: "#633806" }}>
            {fmt(totalPending)} pending from {books.filter(b => b.status !== "complete").length} active books.
          </span>
        </div>
      )}

      {/* Recent collections */}
      <SectionLabel>Recent collections</SectionLabel>
      {recent.length === 0 && (
        <div style={{ textAlign: "center", color: "#888780", fontSize: 12, padding: "16px 0" }}>No collections recorded yet</div>
      )}
      {recent.map(col => {
        const book = books.find(b => b.id === col.bookId);
        const member = members.find(m => m.id === col.memberId);
        const s = book ? getSeriesFromBook(book.bookNumber) : null;
        if (!member) return null;
        return (
          <Card key={col.id} onClick={() => onNavigate("books")}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={`${member.firstName} ${member.lastName}`} bg="#EAF3DE" color="#27500A" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{member.firstName} {member.lastName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                  {s && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 5, background: s.bg, color: s.color, fontWeight: 500 }}>{book.bookNumber}</span>}
                  <span style={{ fontSize: 10, color: "#888780" }}>{col.date} · {col.paymentMode}</span>
                </div>
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
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
