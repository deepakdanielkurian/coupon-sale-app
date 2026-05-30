import { useState } from "react";
import { useApp } from "../data/AppContext";
import { LABELS, generateBookId, getBookStats, validateTicketRange } from "../data/store";
import { Card, Badge, Avatar, SectionLabel, InputField, SelectField, PrimaryButton, OutlineButton, InfoChip, StatusBadge, fmt } from "../components/UI";

const RED = "#8B0000", GOLD = "#FFD700";

function AssignBookForm({ onSave, onCancel }) {
  const { data } = useApp();
  const [memberId, setMemberId] = useState("");
  const [bookNum, setBookNum] = useState("");
  const [ticketCount, setTicketCount] = useState("30");
  const [ticketFrom, setTicketFrom] = useState("");
  const [ticketTo, setTicketTo] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [returnDeadline, setReturnDeadline] = useState("2026-06-30");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});

  const member = data.members.find(m => m.id === memberId);
  const memberBooks = memberId ? data.books.filter(b => b.memberId === memberId) : [];
  const rangeValidation = ticketFrom && ticketTo && ticketCount
    ? validateTicketRange(ticketFrom, ticketTo, parseInt(ticketCount), data.books)
    : null;
  const totalValue = rangeValidation?.valid ? parseInt(ticketCount) * 1000 : 0;

  // Auto-compute To from From + count
  function handleFromChange(v) {
    setTicketFrom(v);
    if (v && ticketCount) {
      const to = parseInt(v) + parseInt(ticketCount) - 1;
      if (!isNaN(to)) setTicketTo(String(to));
    }
  }

  function handleCountChange(v) {
    setTicketCount(v);
    if (ticketFrom && v) {
      const to = parseInt(ticketFrom) + parseInt(v) - 1;
      if (!isNaN(to)) setTicketTo(String(to));
    }
  }

  function submit() {
    const e = {};
    if (!memberId) e.member = "Select a member";
    if (!bookNum.trim()) e.bookNum = "Required";
    if (!rangeValidation?.valid) e.range = rangeValidation?.errors[0] || "Invalid range";
    if (Object.keys(e).length) { setErrors(e); return; }
    const id = generateBookId(data.books);
    onSave({ id, bookNumber: bookNum.trim(), memberId, ticketCount: parseInt(ticketCount), ticketFrom: parseInt(ticketFrom), ticketTo: parseInt(ticketTo), issueDate, returnDeadline, status: "not_started", notes });
  }

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "12px 10px 14px" }}>
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
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>{member.firstName} {member.lastName}</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
              <Badge type={member.label} />
              <span style={{ fontSize: 10, color: "#888780" }}>{member.id}</span>
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A" }}>{memberBooks.length} book{memberBooks.length !== 1 ? "s" : ""}</div>
            <div style={{ fontSize: 9, color: "#888780" }}>assigned</div>
          </div>
        </div>
      )}

      {memberBooks.length > 0 && (
        <>
          <div style={{ fontSize: 10, color: "#854F0B", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5 }}>Books already assigned</div>
          {memberBooks.map(b => (
            <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, border: "0.5px solid rgba(0,0,0,0.08)", padding: "6px 10px", marginBottom: 5, fontSize: 11 }}>
              <i className="ti ti-ticket" style={{ color: RED, fontSize: 13 }} />
              <span style={{ fontWeight: 500, color: "#2C2C2A", flex: 1 }}>Book {b.bookNumber}</span>
              <span style={{ color: "#888780" }}>Tickets {b.ticketFrom}–{b.ticketTo}</span>
              <StatusBadge status={b.status} />
            </div>
          ))}
        </>
      )}

      <SectionLabel>Book details</SectionLabel>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1 }}><InputField label="Book number" required value={bookNum} onChange={setBookNum} placeholder="B-031" error={errors.bookNum} /></div>
        <div style={{ flex: 1 }}><InputField label="No. of tickets" required type="number" value={ticketCount} onChange={handleCountChange} /></div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1 }}><InputField label="Price per ticket" value="₹1,000 (fixed)" disabled /></div>
        <div style={{ flex: 1 }}><InputField label="Issue date" type="date" value={issueDate} onChange={setIssueDate} /></div>
      </div>
      <InputField label="Return deadline" type="date" value={returnDeadline} onChange={setReturnDeadline} />

      {/* Ticket range */}
      <div style={{ background: "#f0ede8", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: "#854F0B", fontWeight: 500, marginBottom: 8 }}>
          <i className="ti ti-hash" style={{ fontSize: 12, marginRight: 4 }} />Ticket number range *
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#888780", marginBottom: 4 }}>From</div>
            <input type="number" value={ticketFrom} onChange={e => handleFromChange(e.target.value)} placeholder="001" style={{ width: 64, background: "#fff", border: `1px solid ${ticketFrom ? RED : "rgba(0,0,0,0.15)"}`, borderRadius: 7, padding: "7px 4px", fontSize: 13, textAlign: "center", outline: "none" }} />
          </div>
          <span style={{ color: "#888780", fontSize: 14, marginTop: 14 }}>—</span>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#888780", marginBottom: 4 }}>To</div>
            <input type="number" value={ticketTo} onChange={e => setTicketTo(e.target.value)} placeholder="030" style={{ width: 64, background: rangeValidation ? (rangeValidation.valid ? "#EAF3DE" : "#FCEBEB") : "#fff", border: `1px solid ${rangeValidation ? (rangeValidation.valid ? "#639922" : "#E24B4A") : "rgba(0,0,0,0.15)"}`, borderRadius: 7, padding: "7px 4px", fontSize: 13, textAlign: "center", outline: "none", color: rangeValidation?.valid ? "#27500A" : rangeValidation ? "#791F1F" : "#2C2C2A" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: "#888780", marginBottom: 4 }}>Total</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: rangeValidation?.valid ? "#3B6D11" : rangeValidation ? "#A32D2D" : "#888780" }}>
              {ticketFrom && ticketTo ? `${parseInt(ticketTo) - parseInt(ticketFrom) + 1} tickets` : "—"}
            </div>
          </div>
        </div>
        {rangeValidation && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, background: rangeValidation.valid ? "#EAF3DE" : "#FCEBEB", borderRadius: 7, padding: "6px 8px" }}>
            <i className={`ti ${rangeValidation.valid ? "ti-circle-check" : "ti-circle-x"}`} style={{ color: rangeValidation.valid ? "#3B6D11" : "#A32D2D", fontSize: 13, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 11, color: rangeValidation.valid ? "#27500A" : "#791F1F", lineHeight: 1.4 }}>{rangeValidation.valid ? `${ticketFrom} to ${ticketTo} = ${rangeValidation.count} tickets. Matches. No overlap.` : rangeValidation.errors[0]}</span>
          </div>
        )}
      </div>

      {rangeValidation?.valid && (
        <div style={{ background: RED, borderRadius: 10, padding: "10px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Total book value</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: "#fff" }}>{fmt(totalValue)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>Tickets × price</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: GOLD }}>{ticketCount} × ₹1,000</div>
          </div>
        </div>
      )}

      <InputField label="Notes (optional)" value={notes} onChange={setNotes} placeholder="Any instructions..." />
      <PrimaryButton onClick={submit} disabled={!rangeValidation?.valid || !memberId || !bookNum}>
        <i className="ti ti-ticket" /> Issue book{member ? ` to ${member.firstName} ${member.lastName}` : ""}
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

function RecordCollectionForm({ book, onSave, onCancel }) {
  const { data } = useApp();
  const stats = getBookStats(book, data.collections);
  const member = data.members.find(m => m.id === book.memberId);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ticketsSold, setTicketsSold] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [remarks, setRemarks] = useState("");

  const tickets = parseInt(ticketsSold) || 0;
  const amount = tickets * 1000;
  const newTotalSold = stats.totalSold + tickets;
  const newTotalCollected = stats.totalCollected + amount;
  const newPending = book.ticketCount * 1000 - newTotalCollected;
  const newTicketsPending = book.ticketCount - newTotalSold;

  function submit() {
    if (!tickets || tickets <= 0) return;
    onSave({ id: `C-${Date.now()}`, bookId: book.id, memberId: book.memberId, date, ticketsSold: tickets, amount, paymentMode, remarks });
  }

  return (
    <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "12px 10px 14px" }}>
      <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 10 }}>
        {[
          ["Member", `${member?.firstName} ${member?.lastName}`],
          ["Book number", book.bookNumber],
          ["Ticket range", `${book.ticketFrom} – ${book.ticketTo}`],
          ["Total value", fmt(book.ticketCount * 1000)],
          ["Already collected", fmt(stats.totalCollected)],
          ["Pending", fmt(stats.pending)],
        ].map(([l, v], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 5 ? "0.5px solid rgba(0,0,0,0.05)" : "none", fontSize: 11 }}>
            <span style={{ color: "#5F5E5A" }}>{l}</span>
            <span style={{ fontWeight: 500, color: "#2C2C2A" }}>{v}</span>
          </div>
        ))}
      </div>

      <InfoChip>Pending amount and ticket count auto-calculate after you enter tickets sold.</InfoChip>

      <SectionLabel>This collection entry</SectionLabel>
      <InputField label="Collection date" type="date" value={date} onChange={setDate} required />
      <InputField label="Tickets sold this time" type="number" value={ticketsSold} onChange={setTicketsSold} required placeholder={`Max ${book.ticketCount - stats.totalSold} remaining`} />

      <div style={{ background: "#f0ede8", borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 4 }}>Amount (auto-calculated)</div>
        <div style={{ fontSize: 22, fontWeight: 500, color: RED }}>{fmt(amount)}</div>
        <div style={{ fontSize: 10, color: "#888780", marginTop: 2 }}>{tickets} tickets × ₹1,000</div>
      </div>

      {tickets > 0 && (
        <div style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#2C2C2A", marginBottom: 8 }}>After this entry</div>
          {[
            ["Tickets sold (total)", `${newTotalSold} / ${book.ticketCount}`],
            ["Tickets pending", `${newTicketsPending} remaining`, newTicketsPending > 0 ? "#854F0B" : "#3B6D11"],
            ["Total collected", fmt(newTotalCollected), "#3B6D11"],
            ["Balance to collect", fmt(Math.max(0, newPending)), newPending > 0 ? "#854F0B" : "#3B6D11"],
            ["Book completion", `${Math.round((newTotalSold / book.ticketCount) * 100)}%`],
          ].map(([l, v, c], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: i < 4 ? "0.5px solid rgba(0,0,0,0.05)" : "none", fontSize: 11 }}>
              <span style={{ color: "#5F5E5A" }}>{l}</span>
              <span style={{ fontWeight: 500, color: c || "#2C2C2A" }}>{v}</span>
            </div>
          ))}
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
      <PrimaryButton onClick={submit} disabled={!tickets || tickets <= 0 || tickets > (book.ticketCount - stats.totalSold)}>
        <i className="ti ti-check" /> Save collection entry
      </PrimaryButton>
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
    </div>
  );
}

export default function BooksScreen() {
  const { data, addBook, addCollection } = useApp();
  const [view, setView] = useState("list"); // list | assign | collect
  const [selectedBook, setSelectedBook] = useState(null);
  const [filter, setFilter] = useState("all");

  const filtered = data.books.filter(b => filter === "all" ? true : b.status === filter);

  if (view === "assign") return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      <div style={{ background: RED, padding: "10px 14px 12px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={() => setView("list")} style={{ background: "none", border: "none", color: GOLD, fontSize: 20, cursor: "pointer", padding: 0 }}><i className="ti ti-arrow-left" /></button>
        <div>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Assign coupon book</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>Super admin · Coordinator action</div>
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
        <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 10, marginTop: 2 }}>₹1,000 per ticket · {data.books.length} books issued</div>
      </div>
      <div style={{ background: "#f7f4f0", flex: 1, overflowY: "auto", padding: "10px 10px 4px" }}>
        <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
          {[["all", "All"], ["not_started", "Not started"], ["ongoing", "Ongoing"], ["complete", "Complete"]].map(([v, l]) => (
            <div key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? RED : "#fff", color: filter === v ? GOLD : "#5F5E5A", border: `0.5px solid ${filter === v ? RED : "rgba(0,0,0,0.12)"}`, borderRadius: 14, padding: "4px 10px", fontSize: 10, cursor: "pointer" }}>
              {l} ({v === "all" ? data.books.length : data.books.filter(b => b.status === v).length})
            </div>
          ))}
        </div>

        {filtered.map(book => {
          const stats = getBookStats(book, data.collections);
          const member = data.members.find(m => m.id === book.memberId);
          const pct = Math.round((stats.totalSold / book.ticketCount) * 100);
          const barColor = book.status === "complete" ? "#639922" : book.status === "ongoing" ? "#EF9F27" : "#E24B4A";
          return (
            <div key={book.id} style={{ background: "#fff", borderRadius: 10, border: "0.5px solid rgba(0,0,0,0.08)", padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: RED, display: "flex", alignItems: "center", justifyContent: "center", color: GOLD, fontSize: 16, flexShrink: 0 }}>
                  <i className="ti ti-ticket" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#2C2C2A" }}>Book {book.bookNumber}</div>
                  <div style={{ fontSize: 10, color: "#888780", marginTop: 1 }}>
                    {member ? `${member.firstName} ${member.lastName}` : "—"} · Tickets {book.ticketFrom}–{book.ticketTo}
                  </div>
                </div>
                <StatusBadge status={book.status} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 7, background: "#f0ede8", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 10, color: "#888780" }}>{stats.totalSold}/{book.ticketCount}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                <span style={{ color: "#3B6D11", fontWeight: 500 }}>Collected: {fmt(stats.totalCollected)}</span>
                <span style={{ color: stats.pending > 0 ? "#854F0B" : "#888780" }}>Pending: {fmt(stats.pending)}</span>
              </div>

              {book.status !== "complete" && (
                <button onClick={() => { setSelectedBook(book); setView("collect"); }} style={{ width: "100%", background: RED, color: GOLD, border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 500, cursor: "pointer", marginTop: 8 }}>
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
