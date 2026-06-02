export const LABELS = {
  committee_member: { label: "Committee member", color: "#3B6D11", bg: "#EAF3DE" },
  outside_member:   { label: "Outside member",   color: "#185FA5", bg: "#E6F1FB" },
  commission_agent: { label: "Commission agent", color: "#854F0B", bg: "#FAEEDA" },
  common:           { label: "Common",           color: "#3C3489", bg: "#EEEDFE" },
};
export function getBookStats(book, collections) {
  const c = collections.filter(x => x.bookId === book.id);
  const totalSold = c.reduce((s,x)=>s+(x.ticketsSold||0),0);
  const totalCollected = c.reduce((s,x)=>s+(x.amount||0),0);
  const totalValue = book.ticketCount * 1000;
  return { totalSold, totalCollected, totalValue, pending: totalValue-totalCollected, ticketsPending: book.ticketCount-totalSold, collections: c };
}
export function getMemberStats(memberId, books, collections) {
  const mb = books.filter(b=>b.memberId===memberId);
  let totalCollected=0, totalPending=0, totalTickets=0, soldTickets=0;
  mb.forEach(b => { const s=getBookStats(b,collections); totalCollected+=s.totalCollected; totalPending+=s.pending; totalTickets+=b.ticketCount; soldTickets+=s.totalSold; });
  return { memberBooks:mb, totalCollected, totalPending, totalTickets, soldTickets };
}
export function fmt(num) { return "₹"+Number(num||0).toLocaleString("en-IN"); }
export function generateMemberId(members) { return `NCB-2026-${String(members.length+1).padStart(3,"0")}`; }
