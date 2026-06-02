import { useState } from "react";
import { useApp } from "../data/AppContext";
import { getBookStats, getMemberStats, LABELS } from "../data/store";
import { BOOK_SERIES, getSeriesFromBook, TOTAL_TICKETS, TICKET_PRICE } from "../data/bookConfig";
import { Card, SectionLabel, Badge, Avatar, StatusBadge, fmt } from "../components/UI";
import {
  generateSummaryPDF, generateCouponSalePDF, generateMemberWisePDF,
  generatePendingPDF, generateInventoryPDF, generateHistoryPDF,
  downloadPDF, printPDF,
} from "../utils/pdfGenerator";

const RED = "#8B0000", GOLD = "#FFD700";

const REPORT_DEFS = [
  { id: "summary",   title: "Summary report",              sub: "Grand total · all collections",            icon: "ti-chart-bar",     iconBg: "#EAF3DE", iconColor: "#3B6D11", pages: "~2 pages",  tags: ["Grand total", "Series breakdown", "Member table"] },
  { id: "coupon",    title: "Coupon sale report",          sub: "Book-wise · ticket ranges · collected",    icon: "ti-ticket",        iconBg: "#E6F1FB", iconColor: "#185FA5", pages: "~3 pages",  tags: ["Books issued", "Ticket ranges", "Pending balance"] },
  { id: "member",    title: "Member-wise report",          sub: "Each member · all books · history",        icon: "ti-user",          iconBg: "#FAEEDA", iconColor: "#854F0B", pages: "~4 pages",  tags: ["Name & label", "Books assigned", "Collection history"] },
  { id: "pending",   title: "Pending / defaulters report", sub: "Members with outstanding balance",         icon: "ti-alert-triangle",iconBg: "#FCEBEB", iconColor: "#A32D2D", pages: "~1 page",   tags: ["Overdue members", "Amount pending", "Contact info"] },
  { id: "inventory", title: "Book inventory report",       sub: "All 500 books · A/B/C series · status",   icon: "ti-books",         iconBg: "#EEEDFE", iconColor: "#3C3489", pages: "~2 pages",  tags: ["Book numbers", "Ticket ranges", "Return status"] },
  { id: "history",   title: "Collection history report",   sub: "Day-by-day · all payment entries",         icon: "ti-calendar",      iconBg: "#EAF3DE", iconColor: "#3B6D11", pages: "~5 pages",  tags: ["Date-wise entries", "Cash / UPI", "Running total"] },
];

const GENERATORS = {
  summary:   generateSummaryPDF,
  coupon:    generateCouponSalePDF,
  member:    generateMemberWisePDF,
  pending:   generatePendingPDF,
  inventory: generateInventoryPDF,
  history:   generateHistoryPDF,
};

const FILENAMES = {
  summary:   "NCB_Summary_Report",
  coupon:    "NCB_Coupon_Sale_Report",
  member:    "NCB_Member_Wise_Report",
  pending:   "NCB_Pending_Report",
  inventory: "NCB_Book_Inventory",
  history:   "NCB_Collection_History",
};

// ── Inline report viewer ──────────────────────────────────────
function ReportView({ reportId, data }) {
  const { books, collections, members } = data;
  const totalCollected = collections.reduce((s, c) => s + (c.amount || 0), 0);
  const totalValue = TOTAL_TICKETS * TICKET_PRICE;
  const soldTickets = collections.reduce((s, c) => s + (c.ticketsSold || 0), 0);

  const Divider = () => <div style={{ height: "0.5px", background: "rgba(0,0,0,0.07)", margin: "6px 0" }} />;

  const InfoRow = ({ label, value, color }) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)", fontSize: 11 }}>
      <span style={{ color: "#5F5E5A" }}>{label}</span>
      <span style={{ fontWeight: 500, color: color || "#2C2C2A" }}>{value}</span>
    </div>
  );

  const Letterhead = () => (
    <div style={{ background: RED, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
      <div style={{ fontSize: 9, color: GOLD }}>Niranam Chudan Vallasamithi & NBC · Reg. PTM/TC/105/2022</div>
      <div style={{ color: "#fff", fontSize: 13, fontWeight: 500, marginTop: 4 }}>{REPORT_DEFS.find(r => r.id === reportId)?.title}</div>
      <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>
        Generated {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
      </div>
    </div>
  );

  const TotalBox = ({ label, value }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "9px 12px", background: RED, borderRadius: 8, margin: "8px 0" }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: GOLD }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500, color: GOLD }}>{value}</span>
    </div>
  );

  if (reportId === "summary") return (
    <div>
      <Letterhead />
      <div style={{ background: RED, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Total collected</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: GOLD }}>{fmt(totalCollected)}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{soldTickets} of {TOTAL_TICKETS.toLocaleString()} tickets sold</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
          {[["Books assigned", books.length], ["Complete", books.filter(b => b.status === "complete").length], ["Pending", fmt(totalValue - totalCollected)], ["Members", members.length]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.1)", borderRadius: 7, padding: "6px 8px" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.55)" }}>{l}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#fff" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
      <SectionLabel>Series breakdown</SectionLabel>
      {Object.entries(BOOK_SERIES).map(([key, s]) => {
        const sBooks = books.filter(b => b.series === key || b.bookNumber?.startsWith(key));
        const sCollected = sBooks.reduce((sum, b) => sum + collections.filter(c => c.bookId === b.id).reduce((s2, c) => s2 + (c.amount || 0), 0), 0);
        const sSold = sBooks.reduce((sum, b) => sum + collections.filter(c => c.bookId === b.id).reduce((s2, c) => s2 + (c.ticketsSold || 0), 0), 0);
        const totalT = s.totalBooks * s.ticketsPerBook;
        const pct = Math.round((sSold / totalT) * 100);
        return (
          <div key={key} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 500, color: s.color, fontSize: 13 }}>{key}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{s.name} · {s.ticketsPerBook} tickets/book</div>
                  <div style={{ fontSize: 10, color: "#888780" }}>{s.totalBooks} books · Tickets {s.ticketStart}–{s.ticketEnd}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(sCollected)}</div>
                <div style={{ fontSize: 9, color: "#888780" }}>{sBooks.length} assigned</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 5, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#639922" : "#EF9F27", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 9, color: "#888780" }}>{sSold}/{totalT} tickets</span>
            </div>
          </div>
        );
      })}
      <SectionLabel>Member summary</SectionLabel>
      {members.map(m => {
        const s = getMemberStats(m.id, books, collections);
        if (s.totalCollected === 0 && s.totalPending === 0) return null;
        return (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "7px 10px", marginBottom: 5 }}>
            <Avatar name={`${m.firstName} ${m.lastName}`} size={28} bg={LABELS[m.label]?.bg} color={LABELS[m.label]?.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
              <div style={{ fontSize: 9, color: "#888780" }}>{s.memberBooks.length} books · {s.soldTickets} tickets</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#3B6D11" }}>{fmt(s.totalCollected)}</div>
              {s.totalPending > 0 && <div style={{ fontSize: 9, color: "#854F0B" }}>{fmt(s.totalPending)} pending</div>}
            </div>
          </div>
        );
      })}
      <TotalBox label="Grand total collected" value={fmt(totalCollected)} />
    </div>
  );

  if (reportId === "coupon") return (
    <div>
      <Letterhead />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {[["Books assigned", books.length], ["Tickets sold", `${soldTickets}/${TOTAL_TICKETS}`], ["Collected", fmt(totalCollected)], ["Pending", fmt(totalValue - totalCollected)]].map(([l, v], i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "#888780" }}>{l}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: i === 2 ? "#3B6D11" : i === 3 ? "#854F0B" : "#2C2C2A" }}>{v}</div>
          </div>
        ))}
      </div>
      <SectionLabel>Book-wise detail</SectionLabel>
      {books.map(book => {
        const s = getBookStats(book, collections);
        const member = members.find(m => m.id === book.memberId);
        const sr = getSeriesFromBook(book.bookNumber);
        const pct = Math.round((s.totalSold / book.ticketCount) * 100);
        return (
          <div key={book.id} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber} {sr && <span style={{ fontSize: 9, background: sr.bg, color: sr.color, padding: "1px 5px", borderRadius: 5, marginLeft: 4 }}>{sr.label}</span>}</div>
                <div style={{ fontSize: 10, color: "#888780" }}>{member?.firstName} {member?.lastName} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
              </div>
              <StatusBadge status={book.status} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 5, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: book.status === "complete" ? "#639922" : "#EF9F27", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, color: "#3B6D11", fontWeight: 500 }}>{fmt(s.totalCollected)}</span>
              <span style={{ fontSize: 10, color: s.pending > 0 ? "#854F0B" : "#888780" }}>{fmt(s.pending)} due</span>
            </div>
          </div>
        );
      })}
      <TotalBox label="Total collected" value={fmt(totalCollected)} />
    </div>
  );

  if (reportId === "member") return (
    <div>
      <Letterhead />
      {members.map(m => {
        const s = getMemberStats(m.id, books, collections);
        const cfg = LABELS[m.label];
        return (
          <div key={m.id} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: "0.5px solid rgba(0,0,0,0.07)" }}>
              <Avatar name={`${m.firstName} ${m.lastName}`} size={34} bg={cfg?.bg} color={cfg?.color} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
                <Badge type={m.label} />
                <span style={{ fontSize: 9, color: "#888780", marginLeft: 6 }}>{m.id}</span>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(s.totalCollected)}</div>
                {s.totalPending > 0 && <div style={{ fontSize: 10, color: "#854F0B" }}>{fmt(s.totalPending)} due</div>}
              </div>
            </div>
            {s.memberBooks.map(book => {
              const bs = getBookStats(book, collections);
              return (
                <div key={book.id} style={{ background: "#f7f4f0", borderRadius: 7, padding: "6px 8px", marginBottom: 5, fontSize: 11 }}>
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
          </div>
        );
      })}
    </div>
  );

  if (reportId === "pending") {
    const pendingMembers = members.map(m => ({ ...m, ...getMemberStats(m.id, books, collections) })).filter(m => m.totalPending > 0);
    return (
      <div>
        <Letterhead />
        <div style={{ background: "#FAEEDA", borderRadius: 8, padding: "8px 10px", marginBottom: 10, display: "flex", gap: 7 }}>
          <i className="ti ti-alert-triangle" style={{ color: "#854F0B", fontSize: 14, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#633806" }}>{pendingMembers.length} members have outstanding balance.</span>
        </div>
        {pendingMembers.length === 0 ? <div style={{ textAlign: "center", color: "#3B6D11", fontSize: 12, padding: "20px 0" }}>✅ All collections complete! No pending balance.</div> :
          pendingMembers.map(m => (
            <div key={m.id} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Avatar name={`${m.firstName} ${m.lastName}`} size={30} bg={LABELS[m.label]?.bg} color={LABELS[m.label]?.color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{m.firstName} {m.lastName}</div>
                  <div style={{ fontSize: 10, color: "#888780" }}>{m.phone} · {m.memberBooks.length} books</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#A32D2D" }}>{fmt(m.totalPending)}</div>
                  <div style={{ fontSize: 9, color: "#888780" }}>pending</div>
                </div>
              </div>
            </div>
          ))
        }
        <TotalBox label="Total pending" value={fmt(pendingMembers.reduce((s, m) => s + m.totalPending, 0))} />
      </div>
    );
  }

  if (reportId === "inventory") return (
    <div>
      <Letterhead />
      {Object.entries(BOOK_SERIES).map(([key, s]) => {
        const sBooks = books.filter(b => b.series === key || b.bookNumber?.startsWith(key));
        return (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ background: s.bg, borderRadius: 8, padding: "7px 10px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: s.color }}>{s.name} — {s.ticketsPerBook} tickets/book</div>
              <div style={{ fontSize: 10, color: s.color }}>{sBooks.length}/{s.totalBooks} assigned</div>
            </div>
            {sBooks.map(book => {
              const member = members.find(m => m.id === book.memberId);
              return (
                <div key={book.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 7, border: "0.5px solid rgba(0,0,0,0.08)", padding: "6px 10px", marginBottom: 4, fontSize: 11 }}>
                  <span style={{ fontWeight: 500, color: "#2C2C2A", minWidth: 42 }}>Book {book.bookNumber}</span>
                  <span style={{ color: "#888780", flex: 1 }}>Tickets {book.ticketFrom}–{book.ticketTo}</span>
                  <span style={{ color: "#888780" }}>{member ? `${member.firstName} ${member.lastName}` : "—"}</span>
                  <StatusBadge status={book.status} />
                </div>
              );
            })}
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
        <SectionLabel>All collection entries ({sorted.length})</SectionLabel>
        {sorted.map((col) => {
          const book = books.find(b => b.id === col.bookId);
          const member = members.find(m => m.id === col.memberId);
          return (
            <div key={col.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#185FA5", flexShrink: 0, marginTop: 4 }} />
              <div style={{ flex: 1, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "7px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{member?.firstName} {member?.lastName} — Book {book?.bookNumber}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(col.amount)}</span>
                </div>
                <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{col.date} · {col.ticketsSold} tickets · {col.paymentMode?.toUpperCase()}</div>
              </div>
            </div>
          );
        })}
        <TotalBox label="Total collected" value={fmt(sorted.reduce((s, c) => s + (c.amount || 0), 0))} />
      </div>
    );
  }

  return null;
}

// ── Main Reports Screen ───────────────────────────────────────
export default function ReportsScreen() {
  const { data, showToast } = useApp();
  const [selected, setSelected] = useState(new Set(["summary", "coupon", "member", "pending"]));
  const [viewing, setViewing] = useState(null);
  const [generating, setGenerating] = useState(false);
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

  // Download a single report PDF
  async function handleDownload(reportId) {
    setGenerating(true);
    try {
      const gen = GENERATORS[reportId];
      const doc = gen(data);
      downloadPDF(doc, FILENAMES[reportId]);
      showToast(`${REPORT_DEFS.find(r => r.id === reportId)?.title} downloaded`);
    } catch (e) {
      showToast("Failed to generate PDF", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Print a single report
  async function handlePrint(reportId) {
    setGenerating(true);
    try {
      const gen = GENERATORS[reportId];
      const doc = gen(data);
      printPDF(doc);
    } catch (e) {
      showToast("Failed to generate PDF for printing", "error");
    } finally {
      setGenerating(false);
    }
  }

  // Download all selected as separate PDFs
  async function handleDownloadSelected() {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      const ids = REPORT_DEFS.filter(r => selected.has(r.id)).map(r => r.id);
      for (const id of ids) {
        const doc = GENERATORS[id](data);
        downloadPDF(doc, FILENAMES[id]);
        await new Promise(r => setTimeout(r, 300));
      }
      showToast(`${ids.length} report${ids.length > 1 ? "s" : ""} downloaded`);
    } catch (e) {
      showToast("Failed to generate PDFs", "error");
    } finally {
      setGenerating(false);
    }
  }

  const selectedReports = REPORT_DEFS.filter(r => selected.has(r.id));

  // ── Report viewer ─────────────────────────────────────────
  if (viewing) {
    const def = REPORT_DEFS.find(r => r.id === viewing);
    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setViewing(null)} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 500 }}>{def.title}</div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10 }}>Preview · Download · Print</div>
          </div>
        </div>

        {/* PDF action bar */}
        <div style={{ background: "#fff", padding: "8px 10px", display: "flex", gap: 6, borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
          <button
            onClick={() => handleDownload(viewing)}
            disabled={generating}
            style={{ flex: 2, background: generating ? "#ccc" : RED, color: GOLD, border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {generating ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} /> Generating...</> : <><i className="ti ti-download" /> Download PDF</>}
          </button>
          <button
            onClick={() => handlePrint(viewing)}
            disabled={generating}
            style={{ flex: 1, background: "#fff", color: RED, border: `0.5px solid ${RED}`, borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <i className="ti ti-printer" /> Print
          </button>
        </div>

        <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 14px" }}>
          <ReportView reportId={viewing} data={data} />
        </div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Report selection screen ───────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px" }}>
        <div style={{ fontSize: 9, color: GOLD, letterSpacing: "0.3px" }}>Niranam Chudan Vallasamithi & NBC</div>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500, marginTop: 2 }}>Reports</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>Select reports to view, download or print</div>
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

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
          {["all", "month", "year", "custom"].map(p => (
            <div key={p} onClick={() => setPeriod(p)} style={{ background: period === p ? RED : "#fff", color: period === p ? GOLD : "#5F5E5A", border: `0.5px solid ${period === p ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 14, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>
              {p === "all" ? "All time" : p === "month" ? "This month" : p === "year" ? "This year" : "Custom"}
            </div>
          ))}
        </div>

        {/* Select all / count */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button onClick={selectAll} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: RED, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <i className="ti ti-checks" style={{ fontSize: 14 }} />
            {selected.size === REPORT_DEFS.length ? "Deselect all" : "Select all"}
          </button>
          <span style={{ fontSize: 11, color: "#888780" }}>{selected.size} of {REPORT_DEFS.length} selected</span>
        </div>

        {/* Report cards */}
        {REPORT_DEFS.map(r => (
          <div key={r.id} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", marginBottom: 8, overflow: "hidden", opacity: selected.has(r.id) ? 1 : 0.65 }}>
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
                <span style={{ fontSize: 9, color: "#888780" }}>{r.pages}</span>
                <button onClick={() => setViewing(r.id)} style={{ background: "#fff", border: `0.5px solid ${RED}`, color: RED, borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>
                  <i className="ti ti-eye" style={{ fontSize: 11 }} /> View
                </button>
              </div>
            </div>
            {/* Tags + individual download/print */}
            <div style={{ background: "#f7f4f0", borderTop: "0.5px solid rgba(0,0,0,0.06)", padding: "6px 12px", display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
              {r.tags.map(t => (
                <span key={t} style={{ fontSize: 9, background: "#fff", border: "0.5px solid rgba(0,0,0,0.1)", borderRadius: 5, padding: "2px 7px", color: "#5F5E5A" }}>{t}</span>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                <button onClick={() => handleDownload(r.id)} style={{ background: RED, color: GOLD, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>
                  <i className="ti ti-download" style={{ fontSize: 11 }} /> PDF
                </button>
                <button onClick={() => handlePrint(r.id)} style={{ background: "#fff", color: RED, border: `0.5px solid ${RED}`, borderRadius: 6, padding: "3px 8px", fontSize: 10, cursor: "pointer" }}>
                  <i className="ti ti-printer" style={{ fontSize: 11 }} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* PDF summary box */}
        {selected.size > 0 && (
          <div style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${RED}`, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="ti ti-file-text" style={{ color: RED, fontSize: 15 }} />
              Will download {selected.size} report{selected.size > 1 ? "s" : ""} as separate PDFs:
            </div>
            {selectedReports.map((r, i) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderBottom: "0.5px solid rgba(0,0,0,0.05)", fontSize: 11 }}>
                <div style={{ width: 16, height: 16, borderRadius: 4, background: RED, color: GOLD, fontSize: 9, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                <span style={{ flex: 1, color: "#2C2C2A" }}>{r.title}</span>
                <span style={{ color: "#888780", fontSize: 10 }}>{r.pages}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: "#EAF3DE", borderRadius: 8, padding: "7px 10px", marginBottom: 10, display: "flex", gap: 6 }}>
          <i className="ti ti-info-circle" style={{ color: "#3B6D11", fontSize: 14, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#27500A", lineHeight: 1.4 }}>Each PDF includes org letterhead and page numbers. Tap "View" to preview before downloading.</span>
        </div>

        {/* Bottom action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleDownloadSelected}
            disabled={selected.size === 0 || generating}
            style={{ flex: 2, background: selected.size > 0 && !generating ? RED : "#ccc", color: selected.size > 0 && !generating ? GOLD : "#fff", border: "none", borderRadius: 9, padding: "11px 4px", fontSize: 12, fontWeight: 500, cursor: selected.size > 0 && !generating ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            {generating
              ? <><i className="ti ti-loader-2" style={{ fontSize: 14, animation: "spin 1s linear infinite" }} /> Generating...</>
              : <><i className="ti ti-download" /> Download {selected.size > 0 ? `${selected.size} PDF${selected.size > 1 ? "s" : ""}` : ""}</>
            }
          </button>
          <button
            onClick={() => { if (viewing) handlePrint(viewing); else if (selectedReports.length > 0) handlePrint(selectedReports[0].id); }}
            disabled={selected.size === 0 || generating}
            style={{ flex: 1, background: "#fff", color: selected.size > 0 ? RED : "#ccc", border: `0.5px solid ${selected.size > 0 ? RED : "#ccc"}`, borderRadius: 9, padding: "11px 4px", fontSize: 12, fontWeight: 500, cursor: selected.size > 0 ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <i className="ti ti-printer" /> Print
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
