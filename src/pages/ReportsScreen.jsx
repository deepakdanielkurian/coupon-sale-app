import { useState } from "react";
import { useApp } from "../data/AppContext";
import { getBookStats, getMemberStats, LABELS } from "../data/store";
import { Card, SectionLabel, Badge, Avatar, StatusBadge, fmt } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

const REPORT_DEFS = [
  { id: "summary", title: "Summary report", sub: "Grand total · all collections combined", icon: "ti-chart-bar", iconBg: "#EAF3DE", iconColor: "#3B6D11", pages: "~2 pages", tags: ["Grand total", "Donut chart", "Member table", "Timeline"] },
  { id: "coupon", title: "Coupon sale report", sub: "Book-wise · ticket ranges · collected vs pending", icon: "ti-ticket", iconBg: "#E6F1FB", iconColor: "#185FA5", pages: "~3 pages", tags: ["Books issued", "Ticket ranges", "Progress bars", "Member table"] },
  { id: "member", title: "Member-wise report", sub: "Each member · all books · full history", icon: "ti-user", iconBg: "#FAEEDA", iconColor: "#854F0B", pages: "~4 pages", tags: ["Name & label", "Books assigned", "Weekly entries", "Balance due"] },
  { id: "pending", title: "Pending / defaulters report", sub: "Members with balance · overdue books", icon: "ti-alert-triangle", iconBg: "#FCEBEB", iconColor: "#A32D2D", pages: "~1 page", tags: ["Overdue members", "Amount pending", "Days overdue"] },
  { id: "inventory", title: "Book inventory report", sub: "All books · ticket ranges · issued vs returned", icon: "ti-books", iconBg: "#EEEDFE", iconColor: "#3C3489", pages: "~2 pages", tags: ["Book numbers", "Ticket ranges", "Return status"] },
  { id: "history", title: "Collection history report", sub: "Day-by-day · all payment entries", icon: "ti-calendar", iconBg: "#EAF3DE", iconColor: "#3B6D11", pages: "~5 pages", tags: ["Date-wise entries", "Cash / UPI", "Running total"] },
];

function ReportView({ reportId, data, onBack }) {
  const { books, collections, members, org } = data;
  const totalCollected = collections.reduce((s, c) => s + c.amount, 0);
  const totalValue = books.reduce((s, b) => s + b.ticketCount * 1000, 0);
  const totalPending = totalValue - totalCollected;
  const allTickets = books.reduce((s, b) => s + b.ticketCount, 0);
  const soldTickets = collections.reduce((s, c) => s + c.ticketsSold, 0);

  const Letterhead = () => (
    <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className="ti ti-building-community" style={{ color: GOLD, fontSize: 16 }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{org.name}</div>
          <div style={{ fontSize: 10, color: "#888780" }}>{org.reg} · {org.event}</div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {[["Report date", new Date().toLocaleDateString("en-IN")], ["Period", "Jan – May 2026"], ["Prepared by", "Coordinator"]].map(([l, v]) => (
          <div key={l}>
            <div style={{ fontSize: 9, color: "#888780" }}>{l}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const TotalRow = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: RED, borderRadius: 8, margin: "8px 0" }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: GOLD }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: GOLD }}>{value}</span>
    </div>
  );

  if (reportId === "summary") return (
    <div>
      <Letterhead />
      <div style={{ background: RED, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Total collected (coupon sales)</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: GOLD }}>{fmt(totalCollected)}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{soldTickets} of {allTickets} tickets sold</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
          {[["Books issued", books.length], ["Books complete", books.filter(b => b.status === "complete").length], ["Pending balance", fmt(totalPending)], ["Members", members.length]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 7, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#fff", marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Book status</SectionLabel>
      <Card>
        {[["Complete", books.filter(b => b.status === "complete").length, "#3B6D11"], ["Ongoing", books.filter(b => b.status === "ongoing").length, "#854F0B"], ["Not started", books.filter(b => b.status === "not_started").length, "#A32D2D"]].map(([l, v, c]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)", fontSize: 11 }}>
            <span style={{ color: "#444441" }}>{l}</span>
            <span style={{ fontWeight: 500, color: c }}>{v} books</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 11 }}>
          <span style={{ color: "#444441" }}>Pending balance</span>
          <span style={{ fontWeight: 500, color: "#854F0B" }}>{fmt(totalPending)}</span>
        </div>
      </Card>
      <SectionLabel>Top collectors</SectionLabel>
      {members.map(m => {
        const s = getMemberStats(m.id, books, collections);
        if (s.totalCollected === 0) return null;
        return (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "7px 10px", marginBottom: 5 }}>
            <Avatar name={`${m.firstName} ${m.lastName}`} size={28} bg={LABELS[m.label].bg} color={LABELS[m.label].color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
              <div style={{ fontSize: 9, color: "#888780" }}>{s.memberBooks.length} book{s.memberBooks.length !== 1 ? "s" : ""} · {s.soldTickets} tickets</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(s.totalCollected)}</div>
              {s.totalPending > 0 && <div style={{ fontSize: 9, color: "#854F0B" }}>{fmt(s.totalPending)} due</div>}
            </div>
          </div>
        );
      })}
      <TotalRow label="Grand total collected" value={fmt(totalCollected)} />
    </div>
  );

  if (reportId === "coupon") return (
    <div>
      <Letterhead />
      <SectionLabel>Coupon sale overview</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
        {[["Total books", books.length], ["Tickets sold", `${soldTickets}/${allTickets}`], ["Collected", fmt(totalCollected)], ["Pending", fmt(totalPending)]].map(([l, v], i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>{l}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: i === 2 ? "#3B6D11" : i === 3 ? "#854F0B" : "#2C2C2A" }}>{v}</div>
          </div>
        ))}
      </div>
      <SectionLabel>Book-wise details</SectionLabel>
      {books.map(book => {
        const s = getBookStats(book, collections);
        const member = members.find(m => m.id === book.memberId);
        const pct = Math.round((s.totalSold / book.ticketCount) * 100);
        return (
          <Card key={book.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber}</div>
                <div style={{ fontSize: 10, color: "#888780" }}>{member?.firstName} {member?.lastName} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
              </div>
              <StatusBadge status={book.status} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div style={{ flex: 1, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: book.status === "complete" ? "#639922" : "#EF9F27", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, color: "#888780" }}>{s.totalSold}/{book.ticketCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
              <span style={{ color: "#3B6D11" }}>Collected: {fmt(s.totalCollected)}</span>
              <span style={{ color: s.pending > 0 ? "#854F0B" : "#888780" }}>Pending: {fmt(s.pending)}</span>
            </div>
          </Card>
        );
      })}
      <TotalRow label="Total collected" value={fmt(totalCollected)} />
    </div>
  );

  if (reportId === "member") return (
    <div>
      <Letterhead />
      {members.map(m => {
        const s = getMemberStats(m.id, books, collections);
        const cfg = LABELS[m.label];
        return (
          <Card key={m.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
              <Avatar name={`${m.firstName} ${m.lastName}`} size={36} bg={cfg.bg} color={cfg.color} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
                <Badge type={m.label} /> <span style={{ fontSize: 10, color: "#888780", marginLeft: 4 }}>{m.id}</span>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(s.totalCollected)}</div>
                {s.totalPending > 0 && <div style={{ fontSize: 10, color: "#854F0B" }}>{fmt(s.totalPending)} due</div>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888780" }}>
              <span>{s.memberBooks.length} book{s.memberBooks.length !== 1 ? "s" : ""} assigned</span>
              <span>{s.soldTickets} / {s.totalTickets} tickets sold</span>
            </div>
            {s.memberBooks.map(book => {
              const bs = getBookStats(book, collections);
              return (
                <div key={book.id} style={{ background: "#f7f4f0", borderRadius: 7, padding: "6px 8px", marginTop: 6, fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber} (Tickets {book.ticketFrom}–{book.ticketTo})</span>
                    <StatusBadge status={book.status} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3, color: "#888780" }}>
                    <span>{bs.totalSold}/{book.ticketCount} sold</span>
                    <span style={{ color: "#3B6D11" }}>{fmt(bs.totalCollected)}</span>
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })}
    </div>
  );

  if (reportId === "pending") return (
    <div>
      <Letterhead />
      <div style={{ background: "#FAEEDA", borderRadius: 8, padding: "8px 10px", marginBottom: 10, display: "flex", gap: 7 }}>
        <i className="ti ti-alert-triangle" style={{ color: "#854F0B", fontSize: 14, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: "#633806" }}>Members or books with outstanding balance.</span>
      </div>
      {members.map(m => {
        const s = getMemberStats(m.id, books, collections);
        if (s.totalPending <= 0) return null;
        return (
          <Card key={m.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar name={`${m.firstName} ${m.lastName}`} size={32} bg={LABELS[m.label].bg} color={LABELS[m.label].color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
                <div style={{ fontSize: 10, color: "#888780" }}>{s.memberBooks.filter(b => getBookStats(b, collections).pending > 0).length} book(s) with pending amount</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "#A32D2D" }}>{fmt(s.totalPending)}</div>
                <div style={{ fontSize: 9, color: "#888780" }}>pending</div>
              </div>
            </div>
          </Card>
        );
      })}
      <TotalRow label="Total pending" value={fmt(totalPending)} />
    </div>
  );

  if (reportId === "inventory") return (
    <div>
      <Letterhead />
      <SectionLabel>All books — inventory</SectionLabel>
      {books.map(book => {
        const member = members.find(m => m.id === book.memberId);
        return (
          <div key={book.id} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "7px 10px", marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-ticket" style={{ color: RED, fontSize: 14 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
              <div style={{ fontSize: 10, color: "#888780" }}>{member?.firstName} {member?.lastName} · Issued {book.issueDate}</div>
            </div>
            <StatusBadge status={book.status} />
          </div>
        );
      })}
    </div>
  );

  if (reportId === "history") {
    const sorted = [...collections].sort((a, b) => new Date(b.date) - new Date(a.date));
    return (
      <div>
        <Letterhead />
        <SectionLabel>All collection entries</SectionLabel>
        {sorted.map((col, i) => {
          const book = books.find(b => b.id === col.bookId);
          const member = members.find(m => m.id === col.memberId);
          return (
            <div key={col.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 7 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#185FA5", flexShrink: 0, marginTop: 3 }} />
              <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "7px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{member?.firstName} {member?.lastName} — Book {book?.bookNumber}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(col.amount)}</span>
                </div>
                <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{col.date} · {col.ticketsSold} tickets · {col.paymentMode.toUpperCase()}</div>
              </div>
            </div>
          );
        })}
        <TotalRow label="Total collected" value={fmt(totalCollected)} />
      </div>
    );
  }

  return null;
}

export default function ReportsScreen() {
  const { data, showToast } = useApp();
  const [selected, setSelected] = useState(new Set(["summary", "coupon", "member", "pending"]));
  const [viewing, setViewing] = useState(null);
  const [period, setPeriod] = useState("all");

  function toggleReport(id) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    selected.size === REPORT_DEFS.length ? setSelected(new Set()) : setSelected(new Set(REPORT_DEFS.map(r => r.id)));
  }

  const selectedReports = REPORT_DEFS.filter(r => selected.has(r.id));
  const totalPages = selectedReports.reduce((s, r) => s + parseInt(r.pages), 0);

  if (viewing) {
    const def = REPORT_DEFS.find(r => r.id === viewing);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{def.title}</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>View · Print · Download</div>
          </div>
          <button onClick={() => showToast("Report downloaded as PDF")} style={{ background: GOLD, color: RED, border: "none", borderRadius: 7, padding: "6px 10px", fontSize: 11, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <i className="ti ti-download" /> PDF
          </button>
        </div>
        <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>
          <ReportView reportId={viewing} data={data} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px" }}>
        <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.3px" }}>Niranam Chudan Vallasamithi &amp; NBC</div>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500, marginTop: 2 }}>Reports</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>Coordinator access · Select to view or export</div>
      </div>
      <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>

        {/* Coordinator badge */}
        <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "9px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 15, flexShrink: 0 }}>
            <i className="ti ti-user" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>{data.coordinator.name}</div>
            <div style={{ fontSize: 10, color: "#888780" }}>{data.org.name}</div>
          </div>
          <div style={{ marginLeft: "auto", background: RED, color: GOLD, fontSize: 9, fontWeight: 500, padding: "3px 8px", borderRadius: 10 }}>Super Admin</div>
        </div>

        {/* Period filter */}
        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
          {["all", "month", "year", "custom"].map(p => (
            <div key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? RED : "#fff", color: period === p ? GOLD : "#5F5E5A", border: `0.5px solid ${period === p ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 14, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>
              {p === "all" ? "All time" : p === "month" ? "This month" : p === "year" ? "This year" : "Custom range"}
            </div>
          ))}
        </div>

        {/* Select all / count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={selectAll} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: RED, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <i className="ti ti-checks" style={{ fontSize: 14 }} />
            {selected.size === REPORT_DEFS.length ? "Deselect all" : "Select all reports"}
          </button>
          <span style={{ fontSize: 11, color: "#888780" }}>{selected.size} of {REPORT_DEFS.length} selected</span>
        </div>

        {/* Report cards */}
        {REPORT_DEFS.map(r => (
          <div key={r.id} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", marginBottom: 8, overflow: "hidden", opacity: selected.has(r.id) ? 1 : 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              <div onClick={() => toggleReport(r.id)} style={{ width: 20, height: 20, borderRadius: 5, border: `1.5px solid ${selected.has(r.id) ? RED : "rgba(0,0,0,0.15)"}`, background: selected.has(r.id) ? RED : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                {selected.has(r.id) && <i className="ti ti-check" style={{ color: GOLD, fontSize: 12 }} />}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: r.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${r.icon}`} style={{ color: r.iconColor, fontSize: 15 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{r.title}</div>
                <div style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>{r.sub}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 10, color: "#888780" }}>{r.pages}</span>
                <button onClick={() => setViewing(r.id)} style={{ background: "#fff", border: `0.5px solid ${RED}`, color: RED, borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>
                  <i className="ti ti-eye" style={{ fontSize: 11 }} /> View
                </button>
              </div>
            </div>
            <div style={{ background: "#f7f4f0", borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "6px 12px", display: "flex", gap: 5, flexWrap: "wrap" }}>
              {r.tags.map(t => (
                <span key={t} style={{ fontSize: 9, background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 5, padding: "2px 7px", color: "#5F5E5A" }}>{t}</span>
              ))}
            </div>
          </div>
        ))}

        {/* PDF summary */}
        {selected.size > 0 && (
          <div style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${RED}`, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-file-text" style={{ color: RED, fontSize: 15 }} />
              Your PDF will include:
            </div>
            {selectedReports.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)", fontSize: 11 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: RED, color: GOLD, fontSize: 9, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <span style={{ flex: 1, color: "#2C2C2A" }}>{r.title}</span>
                <span style={{ color: "#888780", fontSize: 10 }}>{r.pages}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 6, borderTop: "0.5px solid rgba(0,0,0,0.08)", fontSize: 11 }}>
              <span style={{ color: "#5F5E5A" }}>Estimated total</span>
              <span style={{ fontWeight: 500, color: RED }}>~{totalPages} pages · 1 combined PDF</span>
            </div>
          </div>
        )}

        <div style={{ background: "#EAF3DE", borderRadius: 8, padding: "7px 10px", marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 6 }}>
          <i className="ti ti-info-circle" style={{ color: "#3B6D11", fontSize: 14, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#27500A", lineHeight: 1.4 }}>All selected reports merged into one PDF. Org letterhead &amp; page numbers auto-added.</span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => showToast(`Downloaded ${selected.size} reports as PDF`)} disabled={selected.size === 0} style={{ flex: 2, background: selected.size > 0 ? RED : "#ccc", color: selected.size > 0 ? GOLD : "#fff", border: "none", borderRadius: 9, padding: "11px 4px", fontSize: 12, fontWeight: 500, cursor: selected.size > 0 ? "pointer" : "not-allowed" }}>
            <i className="ti ti-download" /> Download PDF ({selected.size} report{selected.size !== 1 ? "s" : ""})
          </button>
          <button onClick={() => showToast("Sent to printer")} disabled={selected.size === 0} style={{ flex: 1, background: "#fff", color: selected.size > 0 ? RED : "#ccc", border: `0.5px solid ${selected.size > 0 ? RED : "#ccc"}`, borderRadius: 9, padding: "11px 4px", fontSize: 12, fontWeight: 500, cursor: selected.size > 0 ? "pointer" : "not-allowed" }}>
            <i className="ti ti-printer" /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
