export const initialData = {
  org: {
    name: "Niranam Chudan Vallasamithi & NBC",
    reg: "Reg. PTM/TC/105/2022",
    event: "Mega Lucky Draw 2026",
    grandPrize: "Maruti Suzuki Wagon R",
    sponsor: "KGA Mall Changanassery",
    ticketPrice: 1000,
  },
  coordinator: {
    name: "Coupon Coordinator",
    role: "Super Admin",
    initials: "CC",
  },
  members: [
    { id: "NCB-2026-001", firstName: "Rajan", lastName: "Kumar", phone: "+91 94470 11111", whatsapp: "+91 94470 11111", address: "Rajan Nivas, Niranam", label: "committee_member", commission: 0, notes: "", createdAt: "2026-01-10" },
    { id: "NCB-2026-002", firstName: "Priya", lastName: "Menon", phone: "+91 94470 22222", whatsapp: "", address: "Menon House, Niranam", label: "committee_member", commission: 0, notes: "", createdAt: "2026-01-10" },
    { id: "NCB-2026-003", firstName: "Suresh", lastName: "Nair", phone: "+91 94470 12345", whatsapp: "+91 94470 12345", address: "Suresh Bhavan, Ward 4", label: "committee_member", commission: 0, notes: "", createdAt: "2026-01-12" },
    { id: "NCB-2026-004", firstName: "Asha", lastName: "Lekha", phone: "+91 94470 44444", whatsapp: "", address: "Lekha House, Niranam", label: "outside_member", commission: 0, notes: "", createdAt: "2026-01-15" },
    { id: "NCB-2026-005", firstName: "Biju", lastName: "Thomas", phone: "+91 94470 55555", whatsapp: "+91 94470 55555", address: "Thomas Villa, Niranam", label: "commission_agent", commission: 5, notes: "5% commission per ticket sold", createdAt: "2026-01-20" },
  ],
  books: [
    { id: "B-001", bookNumber: "B-001", memberId: "NCB-2026-001", ticketCount: 30, ticketFrom: 1, ticketTo: 30, issueDate: "2026-01-15", returnDeadline: "2026-06-30", status: "complete", notes: "" },
    { id: "B-002", bookNumber: "B-002", memberId: "NCB-2026-001", ticketCount: 30, ticketFrom: 31, ticketTo: 60, issueDate: "2026-02-01", returnDeadline: "2026-06-30", status: "complete", notes: "" },
    { id: "B-003", bookNumber: "B-003", memberId: "NCB-2026-002", ticketCount: 30, ticketFrom: 61, ticketTo: 90, issueDate: "2026-01-20", returnDeadline: "2026-06-30", status: "ongoing", notes: "" },
    { id: "B-004", bookNumber: "B-004", memberId: "NCB-2026-003", ticketCount: 30, ticketFrom: 91, ticketTo: 120, issueDate: "2026-02-10", returnDeadline: "2026-06-30", status: "ongoing", notes: "" },
    { id: "B-005", bookNumber: "B-005", memberId: "NCB-2026-003", ticketCount: 30, ticketFrom: 121, ticketTo: 150, issueDate: "2026-03-01", returnDeadline: "2026-06-30", status: "ongoing", notes: "" },
    { id: "B-006", bookNumber: "B-006", memberId: "NCB-2026-004", ticketCount: 50, ticketFrom: 151, ticketTo: 200, issueDate: "2026-02-15", returnDeadline: "2026-06-30", status: "ongoing", notes: "" },
    { id: "B-007", bookNumber: "B-007", memberId: "NCB-2026-005", ticketCount: 30, ticketFrom: 201, ticketTo: 230, issueDate: "2026-03-10", returnDeadline: "2026-06-30", status: "not_started", notes: "" },
  ],
  collections: [
    { id: "C-001", bookId: "B-001", memberId: "NCB-2026-001", date: "2026-01-25", ticketsSold: 15, amount: 15000, paymentMode: "cash", remarks: "" },
    { id: "C-002", bookId: "B-001", memberId: "NCB-2026-001", date: "2026-02-05", ticketsSold: 15, amount: 15000, paymentMode: "cash", remarks: "Final payment" },
    { id: "C-003", bookId: "B-002", memberId: "NCB-2026-001", date: "2026-02-20", ticketsSold: 30, amount: 30000, paymentMode: "upi", remarks: "" },
    { id: "C-004", bookId: "B-003", memberId: "NCB-2026-002", date: "2026-02-10", ticketsSold: 15, amount: 15000, paymentMode: "cash", remarks: "" },
    { id: "C-005", bookId: "B-003", memberId: "NCB-2026-002", date: "2026-03-05", ticketsSold: 7, amount: 7000, paymentMode: "cash", remarks: "" },
    { id: "C-006", bookId: "B-004", memberId: "NCB-2026-003", date: "2026-03-01", ticketsSold: 12, amount: 12000, paymentMode: "cash", remarks: "" },
    { id: "C-007", bookId: "B-004", memberId: "NCB-2026-003", date: "2026-04-01", ticketsSold: 8, amount: 8000, paymentMode: "upi", remarks: "" },
    { id: "C-008", bookId: "B-005", memberId: "NCB-2026-003", date: "2026-04-15", ticketsSold: 10, amount: 10000, paymentMode: "cash", remarks: "" },
    { id: "C-009", bookId: "B-006", memberId: "NCB-2026-004", date: "2026-03-20", ticketsSold: 20, amount: 20000, paymentMode: "cash", remarks: "" },
  ],
};

export const LABELS = {
  committee_member: { label: "Committee member", color: "#3B6D11", bg: "#EAF3DE" },
  outside_member: { label: "Outside member", color: "#185FA5", bg: "#E6F1FB" },
  commission_agent: { label: "Commission agent", color: "#854F0B", bg: "#FAEEDA" },
};

export function getBookStats(book, collections) {
  const bookCols = collections.filter(c => c.bookId === book.id);
  const totalSold = bookCols.reduce((s, c) => s + c.ticketsSold, 0);
  const totalCollected = bookCols.reduce((s, c) => s + c.amount, 0);
  const totalValue = book.ticketCount * 1000;
  const pending = totalValue - totalCollected;
  const ticketsPending = book.ticketCount - totalSold;
  return { totalSold, totalCollected, totalValue, pending, ticketsPending, collections: bookCols };
}

export function getMemberStats(memberId, books, collections) {
  const memberBooks = books.filter(b => b.memberId === memberId);
  let totalCollected = 0, totalPending = 0, totalTickets = 0, soldTickets = 0;
  memberBooks.forEach(book => {
    const stats = getBookStats(book, collections);
    totalCollected += stats.totalCollected;
    totalPending += stats.pending;
    totalTickets += book.ticketCount;
    soldTickets += stats.totalSold;
  });
  return { memberBooks, totalCollected, totalPending, totalTickets, soldTickets };
}

export function validateTicketRange(from, to, ticketCount, existingBooks, excludeBookId = null) {
  const errors = [];
  if (!from || !to) return { valid: false, errors: ["Enter both From and To ticket numbers"] };
  const f = parseInt(from), t = parseInt(to);
  if (isNaN(f) || isNaN(t)) return { valid: false, errors: ["Ticket numbers must be valid numbers"] };
  if (t < f) { errors.push(`"To" (${t}) cannot be less than "From" (${f})`); }
  else {
    const count = t - f + 1;
    if (count > ticketCount) errors.push(`${f} to ${t} = ${count} tickets. Book has only ${ticketCount}. Reduce "To" by ${count - ticketCount}.`);
    else if (count < ticketCount) errors.push(`${f} to ${t} = ${count} tickets. Book has ${ticketCount}. "To" should be ${f + ticketCount - 1}.`);
    else {
      const overlap = existingBooks.find(b => {
        if (excludeBookId && b.id === excludeBookId) return false;
        return !(t < b.ticketFrom || f > b.ticketTo);
      });
      if (overlap) errors.push(`Tickets ${Math.max(f, overlap.ticketFrom)}–${Math.min(t, overlap.ticketTo)} already assigned to Book ${overlap.bookNumber}. Overlap not allowed.`);
    }
  }
  if (errors.length === 0) return { valid: true, count: t - f + 1, errors: [] };
  return { valid: false, errors };
}

export function generateMemberId(members) {
  const num = (members.length + 1).toString().padStart(3, "0");
  return `NCB-2026-${num}`;
}

export function generateBookId(books) {
  const num = (books.length + 1).toString().padStart(3, "0");
  return `B-${num}`;
}
