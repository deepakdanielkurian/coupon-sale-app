export const BOOK_SERIES = {
  A: { name: "A Series", prefix: "A", ticketsPerBook: 10,  totalBooks: 250, ticketStart: 10001, ticketEnd: 12500, color: "#185FA5", bg: "#E6F1FB", label: "10-ticket book" },
  B: { name: "B Series", prefix: "B", ticketsPerBook: 25,  totalBooks: 200, ticketStart: 12501, ticketEnd: 17500, color: "#0f6e56", bg: "#E1F5EE", label: "25-ticket book" },
  C: { name: "C Series", prefix: "C", ticketsPerBook: 50,  totalBooks: 50,  ticketStart: 17501, ticketEnd: 20000, color: "#854F0B", bg: "#FAEEDA", label: "50-ticket book" },
};
export const TICKET_PRICE = 1000;
export const TOTAL_TICKETS = 10000;
export const TICKET_GLOBAL_START = 10001;
export const TICKET_GLOBAL_END   = 20000;

export function generateAllBooks() {
  const books = []; let cur = TICKET_GLOBAL_START;
  ["A","B","C"].forEach(k => {
    const s = BOOK_SERIES[k];
    for (let i = 1; i <= s.totalBooks; i++) {
      const num = String(i).padStart(3,"0");
      books.push({ bookNumber:`${k}${num}`, series:k, ticketCount:s.ticketsPerBook, ticketFrom:cur, ticketTo:cur+s.ticketsPerBook-1, status:"available", memberId:null, issueDate:null, notes:"" });
      cur += s.ticketsPerBook;
    }
  });
  return books;
}
export const ALL_BOOKS = generateAllBooks();
export function getSeriesFromBook(bookNumber) { return BOOK_SERIES[bookNumber?.charAt(0)?.toUpperCase()] || null; }
export function getSeriesSummary(books, collections) {
  return ["A","B","C"].map(key => {
    const s = BOOK_SERIES[key];
    const sb = books.filter(b => b.series===key || b.bookNumber?.startsWith(key));
    const sold = sb.reduce((sum,b) => sum + collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.ticketsSold||0),0),0);
    const collected = sb.reduce((sum,b) => sum + collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.amount||0),0),0);
    return { key, ...s, assignedBooks:sb.length, completeBooks:sb.filter(b=>b.status==="complete").length, totalTickets:s.totalBooks*s.ticketsPerBook, soldTickets:sold, collected, pending:s.totalBooks*s.ticketsPerBook*TICKET_PRICE-collected };
  });
}
