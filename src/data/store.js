export const LABELS = {
  committee_member: { label: "Committee member", color: "#1a6b3c", bg: "#e8f5ee" },
  outside_member:   { label: "Outside member",   color: "#1565c0", bg: "#e3f2fd" },
  commission_agent: { label: "Commission agent", color: "#7b4400", bg: "#fff3e0" },
  common:           { label: "Common",           color: "#4a148c", bg: "#f3e5f5" },
};

export const ROLES = {
  super_admin: { label: "Super Admin",  color: "#b71c1c", bg: "#ffebee" },
  admin:       { label: "Admin",        color: "#1565c0", bg: "#e3f2fd" },
  member:      { label: "Member",       color: "#1a6b3c", bg: "#e8f5ee" },
  viewer:      { label: "Viewer",       color: "#4a148c", bg: "#f3e5f5" },
};

// ── Core stat calculator ──────────────────────────────────────
// returnedTickets: tickets the seller gave back (can't sell them)
// When a book is stopped/complete with returned tickets:
//   effectiveTickets = ticketCount - returnedTickets
//   pending = effectiveTickets × 1000 - totalCollected
export function getBookStats(book, collections) {
  const c              = collections.filter(x => x.bookId === book.id);
  const totalSold      = c.reduce((s, x) => s + (x.ticketsSold || 0), 0);
  const totalCollected = c.reduce((s, x) => s + (x.amount     || 0), 0);
  const returned       = book.returnedTickets || 0;
  const effective      = book.ticketCount - returned;        // tickets the seller actually had to sell
  const totalValue     = effective * 1000;
  const pending        = Math.max(0, totalValue - totalCollected);
  const isComplete     = book.status === "complete";
  return {
    totalSold,
    totalCollected,
    totalValue,
    pending,
    returned,
    effective,
    ticketsPending: effective - totalSold,
    isComplete,
    collections: c,
  };
}

export function getMemberStats(memberId, books, collections) {
  const mb = books.filter(b => b.memberId === memberId);
  let totalCollected = 0, totalPending = 0, totalTickets = 0, soldTickets = 0;
  mb.forEach(b => {
    const s = getBookStats(b, collections);
    totalCollected += s.totalCollected;
    totalPending   += s.pending;
    totalTickets   += s.effective;   // use effective (returned already deducted)
    soldTickets    += s.totalSold;
  });
  return { memberBooks: mb, totalCollected, totalPending, totalTickets, soldTickets };
}

export function fmt(num) {
  const n = Math.round(Number(num) || 0);
  if (n === 0) return "Rs.0";
  const s       = String(n);
  const last3   = s.slice(-3);
  const rest    = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return "Rs." + grouped + last3;
}

export function generateMemberId(members) {
  return `NCB-2026-${String(members.length + 1).padStart(3, "0")}`;
}
