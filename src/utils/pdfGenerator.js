import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BOOK_SERIES, ALL_BOOKS, TOTAL_TICKETS, TICKET_PRICE, getSeriesFromBook } from "../data/bookConfig";
import { getBookStats, getMemberStats, LABELS, fmt } from "../data/store";

const RED=[139,0,0], GOLD=[255,215,0], WHITE=[255,255,255];
const LIGHT=[247,244,240], DARK=[44,44,42], MUTED=[136,135,128];
const GREEN=[59,109,17], AMBER=[133,79,11], BLUE=[24,95,165];

function pageW(doc){ return doc.internal.pageSize.getWidth(); }

function letterhead(doc, title, subtitle="") {
  const w = pageW(doc);
  doc.setFillColor(...RED); doc.rect(0,0,w,40,"F");
  doc.setFillColor(...GOLD); doc.rect(0,40,w,2,"F");
  doc.setTextColor(...GOLD); doc.setFontSize(7.5); doc.setFont("helvetica","normal");
  doc.text("Niranam Chudan Vallasamithi & Niranam Boat Club NBC",14,11);
  doc.text("Reg. PTM/TC/105/2022  |  Mega Lucky Draw 2026",14,17);
  doc.setTextColor(...WHITE); doc.setFontSize(15); doc.setFont("helvetica","bold");
  doc.text(title,14,30);
  doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(...GOLD);
  const dt = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  doc.text(subtitle||`Generated on ${dt}`,14,37);
  doc.text(dt, w-14, 37, {align:"right"});
  return 50;
}

function addFooter(doc) {
  const n = doc.internal.getNumberOfPages();
  const w = pageW(doc), h = doc.internal.pageSize.getHeight();
  for (let i=1;i<=n;i++) {
    doc.setPage(i);
    doc.setFillColor(...RED); doc.rect(0,h-12,w,12,"F");
    doc.setTextColor(...GOLD); doc.setFontSize(7); doc.setFont("helvetica","normal");
    doc.text("Niranam Chudan Vallasamithi & NBC  |  Confidential",14,h-4);
    doc.text(`Page ${i} of ${n}`,w-14,h-4,{align:"right"});
  }
}

function secTitle(doc,text,y) {
  const w = pageW(doc);
  doc.setFillColor(...LIGHT); doc.rect(14,y-5,w-28,9,"F");
  doc.setTextColor(...RED); doc.setFontSize(8.5); doc.setFont("helvetica","bold");
  doc.text(text.toUpperCase(),16,y); return y+10;
}

function statBox(doc,x,y,w,label,value,vc=DARK) {
  doc.setFillColor(...WHITE); doc.setDrawColor(220,220,215);
  doc.roundedRect(x,y,w,18,2,2,"FD");
  doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text(label,x+4,y+7);
  doc.setTextColor(...vc); doc.setFontSize(10); doc.setFont("helvetica","bold");
  doc.text(String(value),x+4,y+15);
}

function grandBox(doc,y,label,value) {
  const w=pageW(doc);
  doc.setFillColor(...RED); doc.roundedRect(14,y,w-28,12,2,2,"F");
  doc.setTextColor(...GOLD); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.text(label,20,y+8);
  doc.text(value,w-20,y+8,{align:"right"});
  return y+16;
}

const TABLE_STYLES = {
  theme:"grid",
  styles:{fontSize:7.5,cellPadding:2.5,textColor:DARK},
  headStyles:{fillColor:RED,textColor:WHITE,fontStyle:"bold",fontSize:7.5},
  alternateRowStyles:{fillColor:LIGHT},
  margin:{left:14,right:14},
};

// ── 1. SUMMARY ────────────────────────────────────────────────
function addSummary(doc, data, startY) {
  const {books,collections,members} = data;
  const w = pageW(doc);
  let y = startY;

  const totalC  = collections.reduce((s,c)=>s+(c.amount||0),0);
  const sold    = collections.reduce((s,c)=>s+(c.ticketsSold||0),0);
  const complete= books.filter(b=>b.status==="complete").length;

  // Value of ISSUED books only (effective tickets = ticketCount - returned)
  const issuedTickets = books.reduce((s,b)=>s+((b.ticketCount||0)-(b.returnedTickets||0)),0);
  const issuedValue   = issuedTickets * TICKET_PRICE;
  const pendingIssued = Math.max(0, issuedValue - totalC);

  // Grand box
  doc.setFillColor(...RED); doc.roundedRect(14,y,w-28,22,3,3,"F");
  doc.setTextColor(...GOLD); doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text("Total collected (all coupon sales)",20,y+8);
  doc.setFontSize(17); doc.setFont("helvetica","bold");
  doc.text(fmt(totalC),20,y+18);
  doc.setFontSize(8); doc.setFont("helvetica","normal");
  doc.text(`${sold.toLocaleString()} of ${issuedTickets.toLocaleString()} issued tickets sold`,w-20,y+18,{align:"right"});
  y+=28;

  const bw=(w-28-6)/3;
  statBox(doc,14,y,bw,"Books issued",books.length);
  statBox(doc,14+bw+3,y,bw,"Books complete",complete,GREEN);
  statBox(doc,14+(bw+3)*2,y,bw,"Pending to collect",fmt(pendingIssued),AMBER);
  y+=20;

  // Explanatory line for the pending figure — avoids confusion
  doc.setTextColor(...MUTED); doc.setFontSize(7); doc.setFont("helvetica","normal");
  doc.text(
    `Pending = value of issued books (${issuedTickets.toLocaleString()} tickets x Rs.1,000 = ${fmt(issuedValue)}) minus collected (${fmt(totalC)}). Only counts books already issued, not the full draw.`,
    14, y+3, { maxWidth: w-28 }
  );
  y+=10;

  y = secTitle(doc,"Series-wise breakdown",y);
  const serRows = Object.entries(BOOK_SERIES).map(([key,s])=>{
    const sb = books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
    const sc = sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.amount||0),0),0);
    const ss = sb.reduce((sum,b)=>sum+collections.filter(c=>c.bookId===b.id).reduce((s2,c)=>s2+(c.ticketsSold||0),0),0);
    // Ticket range from MASTER config (ALL_BOOKS), not just assigned books
    const masterBooks = ALL_BOOKS.filter(b=>b.series===key);
    const froms = masterBooks.map(b=>b.ticketFrom).filter(n=>n!=null);
    const tos   = masterBooks.map(b=>b.ticketTo).filter(n=>n!=null);
    const range = froms.length ? `${Math.min(...froms)}–${Math.max(...tos)}` : "—";
    return [`${key} Series`,`${s.ticketsPerBook} tickets/book`,`${s.totalBooks} books`,range,`${ss}/${s.totalBooks*s.ticketsPerBook}`,fmt(sc),fmt(s.totalBooks*s.ticketsPerBook*TICKET_PRICE-sc)];
  });
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Series","Type","Total Books","Ticket Range","Tickets Sold","Collected","Pending"]],body:serRows,columnStyles:{5:{textColor:GREEN},6:{textColor:AMBER}}});
  y = doc.lastAutoTable.finalY+8;

  y = secTitle(doc,"Member collection summary",y);

  // ── Build common-ticket buyer aggregates from ticketEntries ──
  // { normalizedName: { displayName, tickets, amount, bookNumbers:Set } }
  const commonAgg = {};
  collections.forEach(c=>{
    const book = books.find(b=>b.id===c.bookId);
    const isCommon = c.isCommon || book?.isCommon;
    if (!isCommon || !c.ticketEntries) return;
    c.ticketEntries.forEach(e=>{
      const raw = (e.buyerName||"").trim();
      if (!raw) return;
      const key = raw.toLowerCase();
      if (!commonAgg[key]) commonAgg[key] = { displayName: raw, tickets:0, amount:0, bookNo: book?.bookNumber||"C" };
      commonAgg[key].tickets += 1;
      commonAgg[key].amount  += (e.amount||1000);
    });
  });

  // Match common buyers to members by name (first+last, case-insensitive, trimmed)
  function memberKey(m){ return `${m.firstName} ${m.lastName}`.trim().toLowerCase(); }
  const usedCommonKeys = new Set();

  // ── Build all member data with their matched common tickets ──
  const allMemData = members.map(m=>{
    const s = getMemberStats(m.id,books,collections);
    const mk = memberKey(m);
    const common = commonAgg[mk] || null;
    if (common) usedCommonKeys.add(mk);
    const totalWithCommon = s.totalCollected + (common?common.amount:0);
    return { m, s, common, totalWithCommon };
  });

  // GROUP 1: Collectors — anyone who collected money (own books or common). Sorted by amount desc.
  const collectors = allMemData
    .filter(({s,common}) => s.totalCollected>0 || common)
    .sort((a,b)=> b.totalWithCommon - a.totalWithCommon);

  // GROUP 3: Zero-collection members — have books but collected nothing. Sorted by name.
  const zeroCollectors = allMemData
    .filter(({s,common}) => s.totalCollected===0 && !common && s.memberBooks.length>0)
    .sort((a,b)=> `${a.m.firstName} ${a.m.lastName}`.localeCompare(`${b.m.firstName} ${b.m.lastName}`));

  const memRows = [];

  // 1. Collectors first (with their common sub-row right below)
  collectors.forEach(({m,s,common})=>{
    const status = s.memberBooks.length===0?"No books":s.totalPending===0&&s.totalCollected>0?"Complete":s.totalCollected>0?"Ongoing":"Not started";
    memRows.push([`${m.firstName} ${m.lastName}`, s.memberBooks.length, `${s.soldTickets}/${s.totalTickets}`, fmt(s.totalCollected), fmt(s.totalPending), status]);
    if (common) {
      memRows.push([`»  ${m.firstName} ${m.lastName}`, `Common book (${common.bookNo})`, `${common.tickets}/${common.tickets}`, fmt(common.amount), fmt(0), "Complete"]);
    }
  });

  // 2. Common-only buyers (no member match) — after the collecting members
  const commonOnly = Object.entries(commonAgg)
    .filter(([key]) => !usedCommonKeys.has(key))
    .map(([,v]) => v)
    .sort((a,b)=> b.amount - a.amount);
  commonOnly.forEach(cb=>{
    memRows.push([cb.displayName, `Common book (${cb.bookNo})`, `${cb.tickets}/${cb.tickets}`, fmt(cb.amount), fmt(0), "Complete"]);
  });

  // 3. Zero-collection members last (have books, collected nothing)
  zeroCollectors.forEach(({m,s})=>{
    memRows.push([`${m.firstName} ${m.lastName}`, s.memberBooks.length, `${s.soldTickets}/${s.totalTickets}`, fmt(s.totalCollected), fmt(s.totalPending), "Not started"]);
  });

  autoTable(doc,{
    startY:y, ...TABLE_STYLES,
    head:[["Member","Books","Tickets","Collected","Pending","Status"]],
    body:memRows,
    columnStyles:{3:{textColor:GREEN},4:{textColor:AMBER}},
    // Style common-book rows with a distinct purple tint
    didParseCell: (hookData) => {
      if (hookData.section==="body" && hookData.row.raw[1] && String(hookData.row.raw[1]).startsWith("Common book")) {
        hookData.cell.styles.fillColor = [243,229,245];   // light purple bg
        hookData.cell.styles.textColor = [74,20,140];      // purple text
      }
    },
  });
  return doc.lastAutoTable.finalY+10;
}

// ── 2. COUPON SALE ────────────────────────────────────────────
function addCouponSale(doc, data, startY) {
  const {books,collections,members} = data;
  const w = pageW(doc); let y = startY;

  const totalC = collections.reduce((s,c)=>s+(c.amount||0),0);
  const sold   = collections.reduce((s,c)=>s+(c.ticketsSold||0),0);
  const bw=(w-28-9)/4;
  statBox(doc,14,y,bw,"Books assigned",books.length);
  statBox(doc,14+bw+3,y,bw,"Tickets sold",`${sold}/${TOTAL_TICKETS}`);
  statBox(doc,14+(bw+3)*2,y,bw,"Total collected",fmt(totalC),GREEN);
  statBox(doc,14+(bw+3)*3,y,bw,"Balance pending",fmt(TOTAL_TICKETS*TICKET_PRICE-totalC),AMBER);
  y+=26;

  y = secTitle(doc,"Book-wise detail",y);
  const rows = books.map(book=>{
    const s = getBookStats(book,collections);
    const m = members.find(x=>x.id===book.memberId);
    const sr = getSeriesFromBook(book.bookNumber);
    return [book.bookNumber,sr?`${sr.name} (${sr.ticketsPerBook}t)`:"",book.isCommon?"Common book":m?`${m.firstName} ${m.lastName}`:"—",`${book.ticketFrom}–${book.ticketTo}`,`${s.totalSold}/${book.ticketCount}`,fmt(s.totalCollected),fmt(s.pending),book.issueDate||"—",book.status==="complete"?"Complete":book.status==="ongoing"?"Ongoing":"Not started"];
  });
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Book","Series","Member","Ticket Range","Sold","Collected","Pending","Issued","Status"]],body:rows,columnStyles:{5:{textColor:GREEN},6:{textColor:AMBER}}});
  return doc.lastAutoTable.finalY+10;
}

// ── 3. MEMBER-WISE ────────────────────────────────────────────
function addMemberWise(doc, data, startY) {
  const {books,collections,members} = data;
  const w = pageW(doc); let y = startY;

  // Sort members by collected amount (highest first)
  const sortedMembers = [...members].map(m=>({
    m, collected: getMemberStats(m.id,books,collections).totalCollected
  })).sort((a,b)=> b.collected - a.collected).map(x=>x.m);

  sortedMembers.forEach(member=>{
    const stats = getMemberStats(member.id,books,collections);
    const cfg   = LABELS[member.label]||LABELS.committee_member;

    // Last collected date for this member
    const memberCols = collections.filter(c => c.memberId===member.id || (member.memberId && c.memberId===member.memberId));
    const lastDate = memberCols.length > 0
      ? memberCols.map(c => c.date).sort().reverse()[0]
      : null;

    // Member header
    doc.setFillColor(...LIGHT); doc.roundedRect(14,y,w-28,22,2,2,"F");
    doc.setTextColor(...DARK); doc.setFontSize(12); doc.setFont("helvetica","bold");
    doc.text(`${member.firstName} ${member.lastName}`,20,y+9);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(...MUTED);
    const memberDisplayId = (member.memberId&&member.memberId.startsWith('NCB-'))?member.memberId:"";
    const lastTxt = lastDate ? `  |  Last collected: ${lastDate}` : "";
    doc.text(`${cfg.label}${memberDisplayId?" | "+memberDisplayId:""}  |  ${member.phone||"—"}${lastTxt}`,20,y+17);
    doc.setTextColor(...GREEN); doc.text(`Collected: ${fmt(stats.totalCollected)}`,w-20,y+9,{align:"right"});
    doc.setTextColor(...AMBER); doc.text(`Pending: ${fmt(stats.totalPending)}`,w-20,y+17,{align:"right"});
    y+=28;

    if (stats.memberBooks.length>0) {
      const bRows = stats.memberBooks.map(book=>{
        const bs=getBookStats(book,collections);
        const sr=getSeriesFromBook(book.bookNumber);
        return [book.bookNumber,sr?.label||"",`${book.ticketFrom}–${book.ticketTo}`,book.ticketCount,bs.totalSold,book.ticketCount-bs.totalSold,fmt(bs.totalCollected),fmt(bs.pending),book.status==="complete"?"Complete":book.status==="ongoing"?"Ongoing":"Not started"];
      });
      autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Book","Type","Ticket Range","Total","Sold","Remaining","Collected","Pending","Status"]],body:bRows,columnStyles:{6:{textColor:GREEN},7:{textColor:AMBER}}});
      y = doc.lastAutoTable.finalY+6;
    }

    // Payment history
    const mCols = collections.filter(c=>c.memberId===member.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
    if (mCols.length>0) {
      const cRows = mCols.map(col=>{
        const book=books.find(b=>b.id===col.bookId);
        return [col.date,book?.bookNumber||"—",col.ticketsSold,fmt(col.amount),(col.paymentMode||"cash").toUpperCase(),col.remarks||"—"];
      });
      autoTable(doc,{startY:y,...TABLE_STYLES,
        head:[["Date","Book","Tickets","Amount","Mode","Remarks"]],body:cRows,
        headStyles:{fillColor:[60,52,137],textColor:WHITE,fontStyle:"bold",fontSize:7.5},
        columnStyles:{3:{textColor:GREEN}}});
      y = doc.lastAutoTable.finalY+10;
    } else { y+=6; }

    if (y > doc.internal.pageSize.getHeight()-30) { doc.addPage(); y=20; }
  });
  return y;
}

// ── 4. PENDING ────────────────────────────────────────────────
function addPending(doc, data, startY) {
  const {books,collections,members} = data;
  const w = pageW(doc); let y = startY;

  const pm = members.map(m=>({...m,...getMemberStats(m.id,books,collections)})).filter(m=>m.totalPending>0).sort((a,b)=>b.totalCollected-a.totalCollected);
  const totalPending = pm.reduce((s,m)=>s+m.totalPending,0);

  doc.setFillColor(250,238,218); doc.roundedRect(14,y,w-28,12,2,2,"F");
  doc.setTextColor(...AMBER); doc.setFontSize(9); doc.setFont("helvetica","bold");
  doc.text(`${pm.length} members have outstanding balance — Total: ${fmt(totalPending)}`,20,y+8);
  y+=18;

  if (pm.length===0) {
    doc.setTextColor(...GREEN); doc.setFontSize(11);
    doc.text("All collections complete! No pending balance.",14,y+8);
    return y+20;
  }

  const rows = pm.map(m=>[`${m.firstName} ${m.lastName}`,LABELS[m.label]?.label||"",m.phone||"—",m.memberBooks.length,fmt(m.totalCollected),fmt(m.totalPending),`${m.memberBooks.filter(b=>getBookStats(b,collections).pending>0).length} book(s)`]);
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Member","Category","Phone","Books","Collected","Pending","Pending Books"]],body:rows,columnStyles:{4:{textColor:GREEN},5:{textColor:[163,45,45],fontStyle:"bold"}}});
  y = doc.lastAutoTable.finalY+8;
  return grandBox(doc,y,"Total outstanding balance",fmt(totalPending));
}

// ── 5. INVENTORY ──────────────────────────────────────────────
function addInventory(doc, data, startY) {
  const {books,collections,members} = data;
  const w = pageW(doc); let y = startY;

  const bw=(w-28-9)/4;
  statBox(doc,14,y,bw,"Total books printed",500);
  statBox(doc,14+bw+3,y,bw,"Books assigned",books.length,GREEN);
  statBox(doc,14+(bw+3)*2,y,bw,"Available",500-books.length,AMBER);
  statBox(doc,14+(bw+3)*3,y,bw,"Complete",books.filter(b=>b.status==="complete").length,GREEN);
  y+=26;

  ["A","B","C"].forEach(key=>{
    const s  = BOOK_SERIES[key];
    const sb = books.filter(b=>b.series===key||b.bookNumber?.startsWith(key));
    y = secTitle(doc,`${s.name} — ${s.ticketsPerBook} tickets/book (${s.totalBooks} total | Tickets ${s.ticketStart}–${s.ticketEnd})`,y);
    if (sb.length===0){ doc.setTextColor(...MUTED); doc.setFontSize(8); doc.text("No books assigned yet.",20,y+4); y+=12; return; }
    const rows = sb.map(book=>{
      const stats=getBookStats(book,collections);
      const m=members.find(x=>x.id===book.memberId);
      return [book.bookNumber,`${book.ticketFrom}–${book.ticketTo}`,book.isCommon?"Common book":m?`${m.firstName} ${m.lastName}`:"—",book.issueDate||"—",`${stats.totalSold}/${book.ticketCount}`,fmt(stats.totalCollected),book.status==="complete"?"Complete":book.status==="ongoing"?"Ongoing":"Not started"];
    });
    autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Book","Ticket Range","Assigned To","Issue Date","Sold","Collected","Status"]],body:rows,columnStyles:{5:{textColor:GREEN}}});
    y = doc.lastAutoTable.finalY+8;
  });
  return y;
}

// ── 6. HISTORY ────────────────────────────────────────────────
function addHistory(doc, data, startY) {
  const {books,collections,members} = data;
  const w = pageW(doc); let y = startY;

  const sorted = [...collections].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const totalC = sorted.reduce((s,c)=>s+(c.amount||0),0);

  const bw=(w-28-6)/3;
  statBox(doc,14,y,bw,"Total entries",sorted.length);
  statBox(doc,14+bw+3,y,bw,"Total collected",fmt(totalC),GREEN);
  statBox(doc,14+(bw+3)*2,y,bw,"Avg per entry",fmt(Math.round(totalC/(sorted.length||1))));
  y+=26;

  y = secTitle(doc,"All collection entries (newest first)",y);
  const rows = sorted.map(col=>{
    const book=books.find(b=>b.id===col.bookId);
    const m=members.find(x=>x.id===col.memberId||x.memberId===col.memberId);
    return [col.date,book.isCommon?"Common book":m?`${m.firstName} ${m.lastName}`:"—",book?.bookNumber||"—",col.ticketsSold,fmt(col.amount),(col.paymentMode||"cash").toUpperCase(),col.remarks||"—"];
  });
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Date","Member","Book","Tickets","Amount","Mode","Remarks"]],body:rows,columnStyles:{4:{textColor:GREEN}}});
  y = doc.lastAutoTable.finalY+8;
  return grandBox(doc,y,"Grand total collected",fmt(totalC));
}

// ── SECTION DIVIDER PAGE ──────────────────────────────────────
function addDividerPage(doc, title, subtitle) {
  doc.addPage();
  const w = pageW(doc), h = doc.internal.pageSize.getHeight();
  doc.setFillColor(...RED); doc.rect(0,0,w,h,"F");
  doc.setFillColor(...GOLD); doc.rect(0,h/2-1,w,2,"F");
  doc.setTextColor(...GOLD); doc.setFontSize(22); doc.setFont("helvetica","bold");
  doc.text(title,w/2,h/2-10,{align:"center"});
  doc.setFontSize(11); doc.setFont("helvetica","normal"); doc.setTextColor(...WHITE);
  doc.text(subtitle,w/2,h/2+10,{align:"center"});
  doc.text("Niranam Chudan Vallasamithi & NBC  |  Mega Lucky Draw 2026",w/2,h-20,{align:"center"});
}

// ── COMBINED PDF — all selected in one file ───────────────────
// ── COMMON TICKETS REPORT ────────────────────────────────────
function addCommonTickets(doc, data, startY) {
  const { books, collections } = data;
  const w = pageW(doc); let y = startY;

  const commonBooks = books.filter(b => b.isCommon);
  const commonCols  = collections.filter(c => {
    const book = books.find(b => b.id === c.bookId);
    return book?.isCommon;
  });
  const totalAmt    = commonCols.reduce((s,c) => s+(c.amount||0), 0);
  const totalTickets= commonCols.reduce((s,c) => s+(c.ticketsSold||0), 0);

  const bw=(w-28-6)/3;
  statBox(doc,14,y,bw,"Common books",commonBooks.length);
  statBox(doc,14+bw+3,y,bw,"Tickets sold",totalTickets,GREEN);
  statBox(doc,14+(bw+3)*2,y,bw,"Total collected",fmt(totalAmt),GREEN);
  y+=26;

  if (commonCols.length===0) {
    doc.setTextColor(...MUTED); doc.setFontSize(9);
    doc.text("No common ticket sales recorded yet.",14,y+5);
    return y+15;
  }

  y = secTitle(doc,"Common ticket sales — individual buyer details",y);

  const rows = [];
  commonCols.forEach(col => {
    const book = books.find(b=>b.id===col.bookId);
    if (col.ticketEntries && col.ticketEntries.length>0) {
      col.ticketEntries.forEach(entry => {
        rows.push([col.date, book?.bookNumber||"—", String(entry.ticketNo), entry.buyerName||"—", fmt(entry.amount||1000), (col.paymentMode||"cash").toUpperCase()]);
      });
    } else {
      rows.push([col.date, book?.bookNumber||"—", "—", "—", fmt(col.amount), (col.paymentMode||"cash").toUpperCase()]);
    }
  });

  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Date","Book","Ticket No.","Buyer Name","Amount","Mode"]],body:rows,columnStyles:{4:{textColor:GREEN}}});
  y = doc.lastAutoTable.finalY+8;
  return grandBox(doc,y,"Total common ticket sales",fmt(totalAmt));
}



export function generateCombinedPDF(selectedIds, data) {
  const doc = new jsPDF({unit:"mm",format:"a4"});

  const SECTIONS = {
    summary:   { title:"Summary Report",              fn:addSummary,   subtitle:"Grand total & all collections overview" },
    coupon:    { title:"Coupon Sale Report",           fn:addCouponSale,subtitle:"Book-wise ticket ranges & collections" },
    member:    { title:"Member-wise Report",           fn:addMemberWise,subtitle:"Individual member books & payment history" },
    pending:   { title:"Pending / Defaulters Report",  fn:addPending,   subtitle:"Members with outstanding balance" },
    inventory: { title:"Book Inventory Report",        fn:addInventory, subtitle:"All 500 books — A/B/C series" },
    history:   { title:"Collection History Report",    fn:addHistory,   subtitle:"All payment entries chronologically" },
    common:    { title:"Common Ticket Sales Report",   fn:addCommonTickets,   subtitle:"Coordinator common books buyer-wise ticket details" },
    remittance:{ title:"Remittance Report",             fn:addRemittanceReport,subtitle:"Money sent to treasurer — mode-wise & member-wise" },
  };

  selectedIds.forEach((id, idx) => {
    const sec = SECTIONS[id];
    if (!sec) return;

    if (idx === 0) {
      // First section: use page 1 (already exists)
      const y = letterhead(doc, sec.title, sec.subtitle);
      sec.fn(doc, data, y);
    } else {
      // Each subsequent section starts on a new page — ONE addPage only
      doc.addPage();
      const y = letterhead(doc, sec.title, sec.subtitle);
      sec.fn(doc, data, y);
    }
  });

  addFooter(doc);
  return doc;
}

export function downloadPDF(doc, filename) {
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function printPDF(doc) {
  const blob = doc.output("blob");
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url,"_blank");
  if (win) {
    win.addEventListener("load",()=>{ win.print(); setTimeout(()=>URL.revokeObjectURL(url),1000); });
  } else {
    // Fallback: open in same tab
    window.location.href = url;
  }
}


// ── REMITTANCE REPORT ─────────────────────────────────────────



export function addRemittanceReport(doc, data, startY) {
  const { remittances, collections, members } = data;
  const w = pageW(doc); let y = startY;

  const totalCollected  = collections.reduce((s,c)=>s+(c.amount||0),0);
  const totalRemitted   = remittances.reduce((s,r)=>s+(r.amount||0),0);
  // coordReceived = only money that came TO coordinator (not direct-to-treasurer)
  const coordReceived   = collections.filter(c=>c.paidTo!=="treasurer").reduce((s,c)=>s+(c.amount||0),0);
  const directVerified  = collections.filter(c=>c.paidTo==="treasurer"&&c.verifiedByCoordinator).reduce((s,c)=>s+(c.amount||0),0);
  const directPending   = collections.filter(c=>c.paidTo==="treasurer"&&!c.verifiedByCoordinator).reduce((s,c)=>s+(c.amount||0),0);
  // Pending to send = what coordinator received minus what already remitted
  const balanceInHand   = Math.max(0, coordReceived - totalRemitted);

  // Mode breakdown — coordinator-received only
  const byMode = {cash:0,upi:0,bank:0};
  collections.filter(c=>c.paidTo!=="treasurer").forEach(c=>{ byMode[c.paymentMode||"cash"]+=(c.amount||0); });

  const bw=(w-28-6)/3;
  statBox(doc,14,y,bw,"Coordinator received",fmt(coordReceived),GREEN);
  statBox(doc,14+bw+3,y,bw,"Total remitted",fmt(totalRemitted),BLUE);
  statBox(doc,14+(bw+3)*2,y,bw,"Pending to remit",fmt(balanceInHand),balanceInHand>0?AMBER:GREEN);
  y+=26;

  // Mode breakdown
  y = secTitle(doc,"Collection by payment mode (coordinator received)",y);
  const modeRows = [
    ["Cash to coordinator",   fmt(byMode.cash)],
    ["UPI to coordinator",    fmt(byMode.upi)],
    ["Bank to coordinator",   fmt(byMode.bank)],
    ["Direct to treasurer (verified)", fmt(directVerified)],
    ["Direct to treasurer (pending)",  fmt(directPending)],
    ["Grand total all collections",    fmt(totalCollected)],
  ];
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Mode","Amount"]],body:modeRows,columnStyles:{1:{textColor:GREEN}}});
  y = doc.lastAutoTable.finalY+8;

  // Member-wise breakdown
  y = secTitle(doc,"Member-wise collected (all time)",y);
  const memberRows = members.map(m=>{
    const mCols = collections.filter(c=>c.memberId===m.id);
    const total  = mCols.reduce((s,c)=>s+(c.amount||0),0);
    const mByMode= {cash:0,upi:0,bank:0};
    mCols.forEach(c=>{ mByMode[c.paymentMode||"cash"]+=(c.amount||0); });
    return [`${m.firstName} ${m.lastName}`, fmt(mByMode.cash), fmt(mByMode.upi), fmt(mByMode.bank), fmt(total)];
  }).filter(r=>r[4]!==fmt(0));
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Member","Cash","UPI","Bank","Total"]],body:memberRows,columnStyles:{4:{textColor:GREEN,fontStyle:"bold"}}});
  y = doc.lastAutoTable.finalY+8;

  // Remittance history
  y = secTitle(doc,"Remittance history — money sent to treasurer",y);
  if (remittances.length===0){
    doc.setTextColor(...MUTED); doc.setFontSize(9);
    doc.text("No remittances recorded yet.",14,y+5);
    return y+15;
  }
  const remRows = remittances.map((r,i)=>[
    r.date,
    fmt(r.amount),
    r.toWhom||"Treasurer",
    (r.paymentMode||"cash").toUpperCase(),
    fmt(r.balanceBefore||0),
    fmt(r.balanceAfter||0),
    r.notes||"—",
  ]);
  autoTable(doc,{startY:y,...TABLE_STYLES,head:[["Date","Amount","Sent To","Mode","Before","After","Notes"]],body:remRows,columnStyles:{1:{textColor:BLUE},5:{textColor:GREEN}}});
  y = doc.lastAutoTable.finalY+8;

  return grandBox(doc,y,balanceInHand===0?"All clear — nothing pending to send":"Pending to remit to treasurer",fmt(balanceInHand));
}
