// ─────────────────────────────────────────────────────────────
// REAL LEDGER-BASED BOOK CONFIGURATION
// Derived from the physical April 2026 distribution diary.
//
// Tickets are allocated SEQUENTIALLY in these segments (not clean
// per-series blocks). Book numbering is sequential within each series.
//
//   1. A001–A050 : 10001–10500   (10 tickets each)  →  50 books
//   2. B001–B024 : 10501–11100   (25 tickets each)  →  24 books
//   3. C001–C050 : 11101–13600   (50 tickets each)  →  50 books
//   4. B025–B204 : 13601–18100   (25 tickets each)  → 180 books
//   5. A051–A240 : 18101–20000   (10 tickets each)  → 190 books
//
//   Totals:  A = 240 books (2,400 tickets)
//            B = 204 books (5,100 tickets)
//            C =  50 books (2,500 tickets)
//            ───────────────────────────────
//            494 books, 10,000 tickets (10001–20000)
// ─────────────────────────────────────────────────────────────

export const BOOK_SERIES = {
  A: { name: "A Series", prefix: "A", ticketsPerBook: 10, totalBooks: 240, color: "#185FA5", bg: "#E6F1FB", label: "10-ticket book" },
  B: { name: "B Series", prefix: "B", ticketsPerBook: 25, totalBooks: 204, color: "#0f6e56", bg: "#E1F5EE", label: "25-ticket book" },
  C: { name: "C Series", prefix: "C", ticketsPerBook: 50, totalBooks: 50,  color: "#854F0B", bg: "#FAEEDA", label: "50-ticket book" },
};

export const TICKET_PRICE        = 1000;
export const TOTAL_TICKETS       = 10000;
export const TICKET_GLOBAL_START = 10001;
export const TICKET_GLOBAL_END   = 20000;

// Allocation segments in physical ticket order
const SEGMENTS = [
  { series: "A", fromBook: 1,  toBook: 50,  startTicket: 10001, per: 10 },
  { series: "B", fromBook: 1,  toBook: 24,  startTicket: 10501, per: 25 },
  { series: "C", fromBook: 1,  toBook: 50,  startTicket: 11101, per: 50 },
  { series: "B", fromBook: 25, toBook: 204, startTicket: 13601, per: 25 },
  { series: "A", fromBook: 51, toBook: 240, startTicket: 18101, per: 10 },
];

export function generateAllBooks() {
  const books = [];
  for (const seg of SEGMENTS) {
    let ticket = seg.startTicket;
    for (let n = seg.fromBook; n <= seg.toBook; n++) {
      const num  = String(n).padStart(3, "0");
      const from = ticket;
      const to   = ticket + seg.per - 1;
      books.push({
        bookNumber: `${seg.series}${num}`,
        series:     seg.series,
        ticketCount:seg.per,
        ticketFrom: from,
        ticketTo:   to,
        status:     "available",
        memberId:   null,
        issueDate:  null,
        notes:      "",
      });
      ticket = to + 1;
    }
  }
  // Sort by book number within each series (A001, A002 ... then B, then C)
  books.sort((a, b) => {
    if (a.series !== b.series) return a.series.localeCompare(b.series);
    return parseInt(a.bookNumber.slice(1)) - parseInt(b.bookNumber.slice(1));
  });
  return books;
}

export const ALL_BOOKS = generateAllBooks();

export function getSeriesFromBook(bookNumber) {
  return BOOK_SERIES[bookNumber?.charAt(0)?.toUpperCase()] || null;
}

// Look up the exact ticket range for any book number (handles the segmented layout)
export function getBookRange(bookNumber) {
  const b = ALL_BOOKS.find(x => x.bookNumber === bookNumber);
  return b ? { ticketFrom: b.ticketFrom, ticketTo: b.ticketTo, ticketCount: b.ticketCount } : null;
}

export function getSeriesSummary(books, collections) {
  return ["A", "B", "C"].map(key => {
    const s  = BOOK_SERIES[key];
    const sb = books.filter(b => b.series === key || b.bookNumber?.startsWith(key));
    const sold = sb.reduce((sum, b) =>
      sum + collections.filter(c => c.bookId === b.id).reduce((s2, c) => s2 + (c.ticketsSold || 0), 0), 0);
    const collected = sb.reduce((sum, b) =>
      sum + collections.filter(c => c.bookId === b.id).reduce((s2, c) => s2 + (c.amount || 0), 0), 0);
    const totalTickets = s.totalBooks * s.ticketsPerBook;
    return {
      key, ...s,
      assignedBooks: sb.length,
      completeBooks: sb.filter(b => b.status === "complete").length,
      totalTickets,
      soldTickets: sold,
      collected,
      pending: totalTickets * TICKET_PRICE - collected,
    };
  });
}
