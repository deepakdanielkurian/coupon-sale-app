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

export function getBookStats(book, collections) {
  const c = collections.filter(x => x.bookId === book.id);
  const totalSold = c.reduce((s, x) => s + (x.ticketsSold || 0), 0);
  const totalCollected = c.reduce((s, x) => s + (x.amount || 0), 0);
  const totalValue = book.ticketCount * 1000;
  return { totalSold, totalCollected, totalValue, pending: totalValue - totalCollected, ticketsPending: book.ticketCount - totalSold, collections: c };
}

export function getMemberStats(memberId, books, collections) {
  const mb = books.filter(b => b.memberId === memberId);
  let totalCollected = 0, totalPending = 0, totalTickets = 0, soldTickets = 0;
  mb.forEach(b => {
    const s = getBookStats(b, collections);
    totalCollected += s.totalCollected;
    totalPending += s.pending;
    totalTickets += b.ticketCount;
    soldTickets += s.totalSold;
  });
  return { memberBooks: mb, totalCollected, totalPending, totalTickets, soldTickets };
}

// Fixed fmt - no locale issues, clean Indian number format
export function fmt(num) {
  const n = Math.round(Number(num) || 0);
  if (n >= 10000000) return "Rs." + (n / 10000000).toFixed(1).replace(/\.0$/, "") + "Cr";
  if (n >= 100000)   return "Rs." + (n / 100000).toFixed(1).replace(/\.0$/, "") + "L";
  const s = String(n);
  if (s.length <= 3) return "Rs." + s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return "Rs." + grouped + "," + last3;
}

export function generateMemberId(members) {
  return `NCB-2026-${String(members.length + 1).padStart(3, "0")}`;
}

// Activity log helpers
export function createLog(action, details, userId, userName) {
  return {
    id: `LOG-${Date.now()}`,
    action,
    details,
    userId,
    userName,
    timestamp: new Date().toISOString(),
  };
}
