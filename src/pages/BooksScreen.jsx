import { useState, useMemo } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, getBookStats } from "../data/store";
import {
  BOOK_SERIES, ALL_BOOKS, TICKET_PRICE, TOTAL_TICKETS,
  TICKET_GLOBAL_START, TICKET_GLOBAL_END,
  getSeriesFromBook, validateTicketRangeForSeries, getSeriesSummary,
} from "../data/bookConfig";
import { Card, Badge, Avatar, SectionLabel, InputField, PrimaryButton, OutlineButton, InfoChip, StatusBadge, fmt } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

// ── Series badge ──────────────────────────────────────────────
function SeriesBadge({ bookNumber }) {
  const s = getSeriesFromBook(bookNumber);
  if (!s) return null;
  return (
    <span style={{ display: "inline-block", fontSize: 9, padding: "2px 7px", borderRadius: 8, fontWeight: 500, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ── Overview cards ────────────────────────────────────────────
function SeriesOverview({ books, collections }) {
  const summary = getSeriesSummary(books, collections);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
      {summary.map(s => {
        const pct = Math.round((s.soldTickets / s.totalTickets) * 100);
        const barColor = pct === 100 ? "#639922" : pct > 50 ? "#EF9F27" : "#E24B4A";
        return (
          <div key={s.key} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: s.color }}>{s.key}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{s.name} — {s.ticketsPerBook} tickets/book</div>
                <div style={{ fontSize: 10, color: "#888780" }}>{s.totalBooks} books · Tickets {s.ticketStart}–{s.ticketEnd}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#3B6D11" }}>{fmt(s.collected)}</div>
                <div style={{ fontSize: 10, color: "#888780" }}>{s.assignedBooks}/{s.totalBooks} assigned</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 10, color: "#888780", minWidth: 70, textAlign: "right" }}>{s.soldTickets}/{s.totalTickets} tickets</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Assign Book Form ──────────────────────────────────────────
function AssignBookForm({ onSave, onCancel }) {
  const { data } = useApp();
  const [memberId, setMemberId] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("");
  const [bookNumber, setBookNumber] = useState("");
  const [ticketFrom, setTicketFrom] = useState("");
  const [ticketTo, setTicketTo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnDeadline, setReturnDeadline] = useState("2026-12-31");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const member = data.members.find(m => m.id === memberId);
  const memberBooks = memberId ? data.books.filter(b => b.memberId === memberId) : [];
  const series = selectedSeries ? BOOK_SERIES[selectedSeries] : null;

  // Available books for selected series (not yet assigned)
  const assignedBookNumbers = data.books.map(b => b.bookNumber);
  const availableBooks = ALL_BOOKS.filter(b =>
    b.series === selectedSeries && !assignedBookNumbers.includes(b.bookNumber)
  );

  // Auto-fill ticket range when book selected
  function handleBookSelect(num) {
    setBookNumber(num);
    const bookDef = ALL_BOOKS.find(b => b.bookNumber === num);
    if (bookDef) {
      setTicketFrom(String(bookDef.ticketFrom));
      setTicketTo(String(bookDef.ticketTo));
    }
  }

  // Auto-fill To when From is typed
  function handleFromChange(v) {
    setTicketFrom(v);
    if (v && series) {
      const to = parseInt(v) + series.ticketsPerBook - 1;
      if (!isNaN(to)) setTicketTo(String(to));
    }
  }

  const validation = bookNumber && ticketFrom && ticketTo
    ? validateTicketRangeForSeries(bookNumber, ticketFrom, ticketTo, data.books)
    : null;

  const totalValue = series ? series.ticketsPerBook * TICKET_PRICE : 0;

  function submit() {
    const e = {};
    if (!memberId) e.member = "Select a member";
    if (!selectedSeries) e.series = "Select a series";
    if (!bookNumber) e.bookNumber = "Select or enter book number";
    if (!validation?.valid) e.range = validation?.errors?.[0] || "Invalid ticket range";
    if (Object.keys(e).length) { setErrors(e); return; }

    onSave({
      bookNumber,
      series: selectedSeries,
      memberId,
      ticketCount: series.ticketsPerBook,
      ticketFrom: parseInt(ticketFrom),
      ticketTo: parseInt(ticketTo),
      issueDate,
      returnDeadline,
      status: "not_started",
      notes,
    });
  }

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "12px 10px 14px" }}>

      {/* Member select */}
      <SectionLabel>Select member</SectionLabel>
      <select value={memberId} onChange={e => setMemberId(e.target.value)} style={{ width: "100%", background: "#fff", border: `0.5px solid ${errors.member ? "#E24B4A" : memberId ? RED : "rgba(0,0,0,0.15)"}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", marginBottom: 4, boxSizing: "border-box" }}>
        <option value="">— choose member —</option>
        {data.members.map(m => {
          const cfg = LABELS[m.label];
          return <option key={m.id} value={m.id}>{m.firstName} {m.lastName} — {cfg.label}</option>;
        })}
      </select>
      {errors.member && <div style={{ fontSize: 10, color: "#A32D2D", marginBottom: 6 }}>{errors.member}</div>}

      {member && (
        <div style={{ background: "#fff", borderRadius: 10, border: `1.5px solid ${RED}`, padding: "8px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <Avatar name={`${member.firstName} ${member.lastName}`} size={32} bg={LABELS[member.label].bg} color={LABELS[member.label].color} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{member.firstName} {member.lastName}</div>
            <Badge type={member.label} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{memberBooks.length} book{memberBooks.length !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 9, color: "#888780" }}>assigned so far</div>
          </div>
        </div>
      )}

      {/* Already assigned books */}
      {memberBooks.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: "#854F0B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5 }}>Already assigned to this member</div>
          {memberBooks.map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "6px 10px", marginBottom: 4, fontSize: 11 }}>
              <span style={{ fontWeight: 500, color: "#2C2C2A", flex: 1 }}>Book {b.bookNumber}</span>
              <span style={{ color: "#888780" }}>Tickets {b.ticketFrom}–{b.ticketTo}</span>
              <SeriesBadge bookNumber={b.bookNumber} />
            </div>
          ))}
        </div>
      )}

      {/* Series select */}
      <SectionLabel>Select book series</SectionLabel>
      <div style={{ display: "flex", gap: 6, marginBottom: errors.series ? 4 : 10 }}>
        {Object.entries(BOOK_SERIES).map(([key, s]) => {
          const remaining = ALL_BOOKS.filter(b => b.series === key && !assignedBookNumbers.includes(b.bookNumber)).length;
          return (
            <div key={key} onClick={() => { setSelectedSeries(key); setBookNumber(""); setTicketFrom(""); setTicketTo(""); }} style={{ flex: 1, border: `${selectedSeries === key ? "1.5px" : "0.5px"} solid ${selectedSeries === key ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 10, padding: "10px 6px", background: selectedSeries === key ? "#FFF5F5" : "#fff", cursor: "pointer", textAlign: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 5px", fontSize: 16, fontWeight: 500, color: s.color }}>{key}</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{s.ticketsPerBook} tickets</div>
              <div style={{ fontSize: 9, color: "#888780", marginTop: 2 }}>{remaining} books left</div>
            </div>
          );
        })}
      </div>
      {errors.series && <div style={{ fontSize: 10, color: "#A32D2D", marginBottom: 6 }}>{errors.series}</div>}

      {/* Series info */}
      {series && (
        <div style={{ background: series.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: series.color }}>{series.name} — {series.label}</div>
          <div style={{ fontSize: 10, color: series.color, opacity: 0.8, marginTop: 2 }}>
            {series.totalBooks} books total · Tickets {series.ticketStart}–{series.ticketEnd} · {availableBooks.length} books available to assign
          </div>
        </div>
      )}

      {/* Book number */}
      {series && (
        <>
          <SectionLabel>Select book number</SectionLabel>
          <select value={bookNumber} onChange={e => handleBookSelect(e.target.value)} style={{ width: "100%", background: "#fff", border: `0.5px solid ${errors.bookNumber ? "#E24B4A" : bookNumber ? RED : "rgba(0,0,0,0.15)"}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", marginBottom: 10, boxSizing: "border-box" }}>
            <option value="">— choose book number —</option>
            {availableBooks.slice(0, 100).map(b => (
              <option key={b.bookNumber} value={b.bookNumber}>{b.bookNumber} (Tickets {b.ticketFrom}–{b.ticketTo})</option>
            ))}
          </select>

          {/* Issue / return dates */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>Issue date *</div>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} style={{ width: "100%", background: "#fff", border: `0.5px solid ${RED}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>Return by</div>
              <input type="date" value={returnDeadline} onChange={e => setReturnDeadline(e.target.value)} style={{ width: "100%", background: "#fff", border: "0.5px solid rgba(0,0,0,0.15)", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Ticket range */}
          <SectionLabel>Ticket number range</SectionLabel>
          <div style={{ background: "#f0ede8", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#888780", marginBottom: 4 }}>From</div>
                <input type="number" value={ticketFrom} onChange={e => handleFromChange(e.target.value)} placeholder={series?.ticketStart} style={{ width: 70, background: "#fff", border: `1px solid ${ticketFrom ? RED : "rgba(0,0,0,0.15)"}`, borderRadius: 7, padding: "7px 4px", fontSize: 12, textAlign: "center", outline: "none" }} />
              </div>
              <span style={{ color: "#888780", fontSize: 14, marginTop: 14 }}>—</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#888780", marginBottom: 4 }}>To</div>
                <input type="number" value={ticketTo} onChange={e => setTicketTo(e.target.value)} placeholder={series ? series.ticketStart + series.ticketsPerBook - 1 : ""} style={{ width: 70, background: validation ? (validation.valid ? "#EAF3DE" : "#FCEBEB") : "#fff", border: `1px solid ${validation ? (validation.valid ? "#639922" : "#E24B4A") : "rgba(0,0,0,0.15)"}`, borderRadius: 7, padding: "7px 4px", fontSize: 12, textAlign: "center", outline: "none", color: validation?.valid ? "#27500A" : validation ? "#791F1F" : "#2C2C2A" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: "#888780", marginBottom: 4 }}>Count</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: validation?.valid ? "#3B6D11" : validation ? "#A32D2D" : "#888780" }}>
                  {ticketFrom && ticketTo ? `${parseInt(ticketTo) - parseInt(ticketFrom) + 1}` : "—"}
                </div>
              </div>
            </div>
            {validation && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, background: validation.valid ? "#EAF3DE" : "#FCEBEB", borderRadius: 7, padding: "6px 8px" }}>
                <i className={`ti ${validation.valid ? "ti-circle-check" : "ti-circle-x"}`} style={{ color: validation.valid ? "#3B6D11" : "#A32D2D", fontSize: 13, flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: validation.valid ? "#27500A" : "#791F1F", lineHeight: 1.4 }}>
                  {validation.valid ? `Tickets ${ticketFrom}–${ticketTo} = ${validation.count} tickets. ✓ Valid for ${series?.name}` : validation.errors[0]}
                </span>
              </div>
            )}
          </div>

          {/* Price (fixed) */}
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>Price per ticket</div>
              <div style={{ background: "#f0ede8", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#888780" }}>₹1,000 (fixed)</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>Total book value</div>
              <div style={{ background: "#f0ede8", border: "0.5px solid rgba(0,0,0,0.08)", borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", fontWeight: 500 }}>{fmt(totalValue)}</div>
            </div>
          </div>

          {/* Book preview banner */}
          {validation?.valid && (
            <div style={{ background: RED, borderRadius: 10, padding: "10px 14px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Book {bookNumber} summary</div>
                <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", marginTop: 2 }}>{fmt(totalValue)}</div>
                <div style={{ fontSize: 10, color: GOLD }}>Tickets {ticketFrom}–{ticketTo}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ background: series.bg, color: series.color, fontSize: 11, fontWeight: 500, padding: "4px 10px", borderRadius: 7, marginBottom: 4 }}>{series.name}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{series.ticketsPerBook} tickets × ₹1,000</div>
              </div>
            </div>
          )}

          <InputField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any instructions..." />
        </>
      )}

      <PrimaryButton onClick={submit} disabled={!validation?.valid || !memberId || !bookNumber}>
        <i className="ti ti-ticket" /> Issue Book {bookNumber || ""}{member ? ` to ${member.firstName}` : ""}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Record Collection Form ────────────────────────────────────
function RecordCollectionForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats = getBookStats(book, data.collections);
  const member = data.members.find(m => m.id === book.memberId);
  const series = getSeriesFromBook(book.bookNumber);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setTicketsSold] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");

  const tickets = parseInt(ticketsSold) || 0;
  const amount = tickets * TICKET_PRICE;
  const remaining = book.ticketCount - stats.totalSold;
  const newTotalSold = stats.totalSold + tickets;
  const newCollected = stats.totalCollected + amount;
  const newPending = book.ticketCount * TICKET_PRICE - newCollected;
  const pct = Math.round((newTotalSold / book.ticketCount) * 100);

  function submit() {
    if (!tickets || tickets <= 0 || tickets > remaining) return;
    onSave({ id: `C-${Date.now()}`, bookId: book.id, memberId: book.memberId, date, ticketsSold: tickets, amount, paymentMode, remarks });
  }

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "12px 10px 14px" }}>

      {/* Book summary */}
      <div style={{ background: series ? series.bg : "#f0ede8", borderRadius: 10, padding: "10px 12px", marginBottom: 10, border: `0.5px solid ${series ? series.color + "40" : "transparent"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber}</div>
            <div style={{ fontSize: 10, color: "#888780" }}>{member?.firstName} {member?.lastName} · Tickets {book.ticketFrom}–{book.ticketTo}</div>
          </div>
          {series && <span style={{ fontSize: 10, fontWeight: 500, color: series.color, background: "#fff", padding: "3px 8px", borderRadius: 7 }}>{series.label}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[["Total tickets", book.ticketCount], ["Sold", stats.totalSold], ["Remaining", remaining]].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.7)", borderRadius: 6, padding: "5px 7px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#888780" }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#2C2C2A" }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11 }}>
          <span style={{ color: "#3B6D11", fontWeight: 500 }}>Collected: {fmt(stats.totalCollected)}</span>
          <span style={{ color: "#854F0B" }}>Pending: {fmt(stats.pending)}</span>
        </div>
      </div>

      <InfoChip>Amount auto-calculates: tickets sold × ₹1,000. Max {remaining} tickets remaining.</InfoChip>

      <SectionLabel>This collection entry</SectionLabel>
      <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 4 }}>Collection date *</div>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: "100%", background: "#fff", border: `0.5px solid ${RED}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, color: "#2C2C2A", outline: "none", marginBottom: 10, boxSizing: "border-box" }} />

      <InputField
        label={`Tickets sold this time (max ${remaining})`}
        type="number"
        value={ticketsSold}
        onChange={setTicketsSold}
        required
        error={tickets > remaining ? `Cannot exceed ${remaining} remaining tickets` : ""}
      />

      {/* Auto amount */}
      <div style={{ background: "#f0ede8", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#5F5E5A", marginBottom: 2 }}>Amount (auto-calculated)</div>
        <div style={{ fontSize: 26, fontWeight: 500, color: RED }}>{fmt(amount)}</div>
        <div style={{ fontSize: 10, color: "#888780" }}>{tickets} tickets × ₹1,000</div>
      </div>

      {/* After-entry preview */}
      {tickets > 0 && tickets <= remaining && (
        <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 8 }}>After this entry</div>
          {[
            ["Tickets sold", `${newTotalSold} / ${book.ticketCount}`],
            ["Remaining", `${book.ticketCount - newTotalSold} left`, book.ticketCount - newTotalSold === 0 ? "#3B6D11" : "#854F0B"],
            ["Total collected", fmt(newCollected), "#3B6D11"],
            ["Balance pending", fmt(Math.max(0, newPending)), newPending <= 0 ? "#3B6D11" : "#854F0B"],
            ["Completion", `${pct}%`],
          ].map(([l, v, c], i, arr) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < arr.length - 1 ? "0.5px solid rgba(0,0,0,0.05)" : "none", fontSize: 11 }}>
              <span style={{ color: "#5F5E5A" }}>{l}</span>
              <span style={{ fontWeight: 500, color: c || "#2C2C2A" }}>{v}</span>
            </div>
          ))}
          {/* Mini progress bar */}
          <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ flex: 1, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? "#639922" : "#EF9F27", borderRadius: 3 }} />
            </div>
            <span style={{ fontSize: 10, color: "#888780" }}>{pct}%</span>
          </div>
        </div>
      )}

      <SectionLabel>Payment mode</SectionLabel>
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        {["cash", "upi", "bank"].map(mode => (
          <div key={mode} onClick={() => setPaymentMode(mode)} style={{ flex: 1, border: `0.5px solid ${paymentMode === mode ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 8, padding: "8px 4px", background: paymentMode === mode ? "#FFF5F5" : "#fff", textAlign: "center", fontSize: 12, color: paymentMode === mode ? RED : "#888780", fontWeight: paymentMode === mode ? 500 : 400, cursor: "pointer" }}>
            {mode.toUpperCase()}
          </div>
        ))}
      </div>

      <InputField label="Remarks (optional)" value={remarks} onChange={setRemarks} placeholder="e.g. 2 tickets unsold returned..." />
      <PrimaryButton onClick={submit} disabled={!tickets || tickets <= 0 || tickets > remaining}>
        <i className="ti ti-check" /> Save collection entry
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

// ── Main Books Screen ─────────────────────────────────────────
export default function BooksScreen() {
  const { data, addBook, addCollection } = useApp();
  const [view, setView] = useState("list");
  const [selectedBook, setSelectedBook] = useState(null);
  const [filterSeries, setFilterSeries] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = data.books.filter(b => {
    const seriesMatch = filterSeries === "all" || b.series === filterSeries || b.bookNumber?.startsWith(filterSeries);
    const statusMatch = filterStatus === "all" || b.status === filterStatus;
    return seriesMatch && statusMatch;
  });

  const totalCollected = data.collections.reduce((s, c) => s + (c.amount || 0), 0);
  const totalTickets = data.books.reduce((s, b) => s + (b.ticketCount || 0), 0);
  const soldTickets = data.collections.reduce((s, c) => s + (c.ticketsSold || 0), 0);

  if (view === "assign") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Assign coupon book</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>500 books · A/B/C series · Tickets 10001–20000</div>
        </div>
      </div>
      <AssignBookForm onSave={b => { addBook(b); setView("list"); }} onCancel={() => setView("list")} />
    </div>
  );

  if (view === "collect" && selectedBook) return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Record collection</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>Book {selectedBook.bookNumber}</div>
        </div>
      </div>
      <RecordCollectionForm book={selectedBook} onSave={col => { addCollection(col); setView("list"); }} onCancel={() => setView("list")} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px" }}>
        <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Coupon books</div>
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>
          500 books · 10,000 tickets (10001–20000) · ₹1,000 each
        </div>
      </div>
      <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 4px" }}>

        {/* Grand totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[
            { label: "Total collected", value: fmt(totalCollected), color: "#3B6D11" },
            { label: "Books assigned", value: `${data.books.length} / 500`, color: "#2C2C2A" },
            { label: "Tickets sold", value: `${soldTickets} / ${totalTickets}`, color: "#2C2C2A" },
            { label: "Pending", value: fmt(totalTickets * 1000 - totalCollected), color: "#854F0B" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "8px 10px" }}>
              <div style={{ fontSize: 10, color: "#888780" }}>{s.label}</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Series overview */}
        <SectionLabel>Series overview</SectionLabel>
        <SeriesOverview books={data.books} collections={data.collections} />

        {/* Filters */}
        <div style={{ display: "flex", gap: 5, marginBottom: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {["all", "A", "B", "C"].map(s => (
              <div key={s} onClick={() => setFilterSeries(s)} style={{ background: filterSeries === s ? RED : "#fff", color: filterSeries === s ? GOLD : "#5F5E5A", border: `0.5px solid ${filterSeries === s ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 14, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>
                {s === "all" ? "All series" : `${s} series`}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["all", "All"], ["not_started", "Not started"], ["ongoing", "Ongoing"], ["complete", "Done"]].map(([v, l]) => (
              <div key={v} onClick={() => setFilterStatus(v)} style={{ background: filterStatus === v ? "#2C2C2A" : "#fff", color: filterStatus === v ? "#fff" : "#5F5E5A", border: `0.5px solid ${filterStatus === v ? "#2C2C2A" : "rgba(0,0,0,0.12)"}`, borderRadius: 14, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>
                {l}
              </div>
            ))}
          </div>
        </div>

        <SectionLabel>Assigned books ({filtered.length})</SectionLabel>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "#888780", fontSize: 12, padding: "30px 0" }}>
            No books assigned yet in this filter
          </div>
        )}

        {filtered.map(book => {
          const stats = getBookStats(book, data.collections);
          const member = data.members.find(m => m.id === book.memberId);
          const pct = Math.round((stats.totalSold / book.ticketCount) * 100);
          const s = getSeriesFromBook(book.bookNumber);
          const barColor = book.status === "complete" ? "#639922" : book.status === "ongoing" ? "#EF9F27" : "#E24B4A";
          return (
            <div key={book.id} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: s ? s.bg : "#f0ede8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 500, color: s ? s.color : "#888780", flexShrink: 0 }}>
                  {book.bookNumber?.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber}</div>
                  <div style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>
                    {member ? `${member.firstName} ${member.lastName}` : "—"} · Tickets {book.ticketFrom}–{book.ticketTo}
                  </div>
                </div>
                <StatusBadge status={book.status} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <div style={{ flex: 1, height: 6, background: "#f0ede8", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, color: "#888780" }}>{stats.totalSold}/{book.ticketCount}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: book.status !== "complete" ? 8 : 0 }}>
                <span style={{ color: "#3B6D11", fontWeight: 500 }}>Collected: {fmt(stats.totalCollected)}</span>
                <span style={{ color: stats.pending > 0 ? "#854F0B" : "#888780" }}>Pending: {fmt(stats.pending)}</span>
              </div>
              {book.status !== "complete" && (
                <button onClick={() => { setSelectedBook(book); setView("collect"); }} style={{ width: "100%", background: RED, color: GOLD, border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                  <i className="ti ti-plus" /> Record collection
                </button>
              )}
            </div>
          );
        })}

        <button onClick={() => setView("assign")} style={{ width: "100%", background: "#fff", color: RED, border: `1px dashed ${RED}`, borderRadius: 10, padding: 11, fontSize: 13, cursor: "pointer", marginBottom: 8 }}>
          <i className="ti ti-plus" /> Assign new book
        </button>
      </div>
    </div>
  );
}
