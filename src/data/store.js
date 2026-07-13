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

export function getMemberStats(memberOrId, books, collections, allMembers) {
  // Accept a member object OR an id string.
  const isObj = memberOrId && typeof memberOrId === "object";
  const primaryId = isObj ? memberOrId.id : memberOrId;

  // Build the set of IDs this member could be stored under on a book/collection.
  // Books may reference either the Firestore doc ID or the custom NCB-2026-xxx field.
  const idSet = new Set();
  if (primaryId) idSet.add(primaryId);
  if (isObj && memberOrId.memberId) idSet.add(memberOrId.memberId);
  // If only an id string was passed, look the member up to find the other form.
  if (!isObj && Array.isArray(allMembers)) {
    const found = allMembers.find(m => m.id === primaryId || m.memberId === primaryId);
    if (found) { if (found.id) idSet.add(found.id); if (found.memberId) idSet.add(found.memberId); }
  }

  const matches = id => id != null && idSet.has(id);

  const mb = books.filter(b => matches(b.memberId));
  let totalCollected = 0, totalPending = 0, totalTickets = 0, soldTickets = 0;
  let toCoordinator = 0, directTreasurer = 0, pendingVerify = 0;
  mb.forEach(b => {
    const s = getBookStats(b, collections);
    totalCollected += s.totalCollected;
    totalPending   += s.pending;
    totalTickets   += s.effective;
    soldTickets    += s.totalSold;
  });
  // Payment destination breakdown
  const memberCols = collections.filter(c => matches(c.memberId));
  memberCols.forEach(c => {
    const amt = c.amount || 0;
    if (c.paidTo === 'treasurer') {
      directTreasurer += amt;
      if (!c.verifiedByCoordinator) pendingVerify += amt;
    } else {
      toCoordinator += amt;
    }
  });
  // Books this member originally owned but has handed over to someone else
  const handedOverBooks = books.filter(b =>
    matches(b.originalMemberId) && !matches(b.memberId)
  );

  return { memberBooks: mb, handedOverBooks, totalCollected, totalPending, totalTickets, soldTickets, toCoordinator, directTreasurer, pendingVerify };
}

// Safe avatar initials — handles missing first/last name (won't crash)
export function initials(m) {
  if (!m) return "?";
  const f = (m.firstName || "").trim();
  const l = (m.lastName || "").trim();
  const a = f ? f[0] : "";
  const b = l ? l[0] : "";
  const out = (a + b).toUpperCase();
  return out || "?";
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
