// ─────────────────────────────────────────────────────────────
//  BOOK & TICKET CONFIGURATION
//  Total 500 books printed | Tickets 10001 – 20000 (10,000 total)
// ─────────────────────────────────────────────────────────────

export const BOOK_SERIES = {
  A: {
    name: "A Series",
    prefix: "A",
    ticketsPerBook: 10,
    totalBooks: 250,
    ticketStart: 10001,
    ticketEnd: 12500,   // 250 × 10 = 2,500 tickets
    color: "#185FA5",
    bg: "#E6F1FB",
    label: "10-ticket book",
  },
  B: {
    name: "B Series",
    prefix: "B",
    ticketsPerBook: 25,
    totalBooks: 200,
    ticketStart: 12501,
    ticketEnd: 17500,   // 200 × 25 = 5,000 tickets
    color: "#0f6e56",
    bg: "#E1F5EE",
    label: "25-ticket book",
  },
  C: {
    name: "C Series",
    prefix: "C",
    ticketsPerBook: 50,
    totalBooks: 50,
    ticketStart: 17501,
    ticketEnd: 20000,   // 50 × 50 = 2,500 tickets
    color: "#854F0B",
    bg: "#FAEEDA",
    label: "50-ticket book",
  },
};

export const TICKET_PRICE = 1000;
export const TOTAL_TICKETS = 10000;      // 10001 – 20000
export const TICKET_GLOBAL_START = 10001;
export const TICKET_GLOBAL_END = 20000;

// Generate all 500 book definitions
export function generateAllBooks() {
  const books = [];
  let ticketCursor = TICKET_GLOBAL_START;

  ["A", "B", "C"].forEach(seriesKey => {
    const s = BOOK_SERIES[seriesKey];
    for (let i = 1; i <= s.totalBooks; i++) {
      const bookNum = String(i).padStart(3, "0");
      const bookName = `${s.prefix}${bookNum}`;
      const from = ticketCursor;
      const to = ticketCursor + s.ticketsPerBook - 1;
      books.push({
        bookNumber: bookName,
        series: seriesKey,
        ticketCount: s.ticketsPerBook,
        ticketFrom: from,
        ticketTo: to,
        status: "available",   // available | assigned | ongoing | complete
        memberId: null,
        issueDate: null,
        returnDeadline: null,
        notes: "",
      });
      ticketCursor = to + 1;
    }
  });

  return books;
}

// All 500 pre-generated books (used for assign dropdown & validation)
export const ALL_BOOKS = generateAllBooks();

// Get series info from book number prefix
export function getSeriesFromBook(bookNumber) {
  const prefix = bookNumber?.charAt(0)?.toUpperCase();
  return BOOK_SERIES[prefix] || null;
}

// Validate ticket range against series rules
export function validateTicketRangeForSeries(bookNumber, ticketFrom, ticketTo, assignedBooks = []) {
  const series = getSeriesFromBook(bookNumber);
  if (!series) return { valid: false, errors: ["Unknown book series"] };

  const f = parseInt(ticketFrom);
  const t = parseInt(ticketTo);
  const count = t - f + 1;
  const errors = [];

  // Check within series range
  if (f < series.ticketStart || t > series.ticketEnd) {
    errors.push(`${series.name} tickets must be between ${series.ticketStart} and ${series.ticketEnd}`);
  }

  // Check count matches series ticket count
  if (!isNaN(f) && !isNaN(t)) {
    if (t < f) {
      errors.push(`"To" (${t}) cannot be less than "From" (${f})`);
    } else if (count !== series.ticketsPerBook) {
      if (count > series.ticketsPerBook) {
        errors.push(`${f} to ${t} = ${count} tickets. ${series.name} books have only ${series.ticketsPerBook} tickets. Reduce "To" by ${count - series.ticketsPerBook}.`);
      } else {
        errors.push(`${f} to ${t} = ${count} tickets. ${series.name} books need exactly ${series.ticketsPerBook}. "To" should be ${f + series.ticketsPerBook - 1}.`);
      }
    }
  }

  // Check overlap with already assigned books
  if (errors.length === 0) {
    const overlap = assignedBooks.find(b => {
      if (!b.ticketFrom || !b.ticketTo) return false;
      return !(t < b.ticketFrom || f > b.ticketTo);
    });
    if (overlap) {
      errors.push(`Tickets overlap with Book ${overlap.bookNumber} (${overlap.ticketFrom}–${overlap.ticketTo}). Already assigned.`);
    }
  }

  if (errors.length === 0) return { valid: true, count, series };
  return { valid: false, errors, series };
}

// Summary stats for all series
export function getSeriesSummary(books, collections) {
  return ["A", "B", "C"].map(key => {
    const s = BOOK_SERIES[key];
    const seriesBooks = books.filter(b => b.series === key || b.bookNumber?.startsWith(key));
    const assignedBooks = seriesBooks.filter(b => b.status !== "available");
    const completeBooks = seriesBooks.filter(b => b.status === "complete");
    const totalTickets = s.totalBooks * s.ticketsPerBook;
    const soldTickets = seriesBooks.reduce((sum, book) => {
      const bookCols = collections.filter(c => c.bookId === book.id);
      return sum + bookCols.reduce((s2, c) => s2 + (c.ticketsSold || 0), 0);
    }, 0);
    const collected = seriesBooks.reduce((sum, book) => {
      const bookCols = collections.filter(c => c.bookId === book.id);
      return sum + bookCols.reduce((s2, c) => s2 + (c.amount || 0), 0);
    }, 0);
    return {
      key,
      ...s,
      assignedBooks: assignedBooks.length,
      completeBooks: completeBooks.length,
      totalTickets,
      soldTickets,
      collected,
      pending: totalTickets * TICKET_PRICE - collected,
    };
  });
}
