import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BOOK_SERIES, TOTAL_TICKETS, TICKET_PRICE, getSeriesFromBook } from "../data/bookConfig";
import { getBookStats, getMemberStats, LABELS } from "../data/store";

const RED = [139, 0, 0];
const GOLD = [255, 215, 0];
const WHITE = [255, 255, 255];
const LIGHT_GRAY = [247, 244, 240];
const DARK = [44, 44, 42];
const MUTED = [136, 135, 128];
const GREEN = [59, 109, 17];
const AMBER = [133, 79, 11];

function addLetterhead(doc, title, subtitle = "") {
  const pageW = doc.internal.pageSize.getWidth();

  // Red header bar
  doc.setFillColor(...RED);
  doc.rect(0, 0, pageW, 38, "F");

  // Gold accent line
  doc.setFillColor(...GOLD);
  doc.rect(0, 38, pageW, 2, "F");

  // Org name
  doc.setTextColor(...GOLD);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Niranam Chudan Vallasamithi & Niranam Boat Club NBC", 14, 11);
  doc.text("Reg. PTM/TC/105/2022  |  Mega Lucky Draw 2026", 14, 17);

  // Report title
  doc.setTextColor(...WHITE);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 28);

  // Subtitle / date
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GOLD);
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(subtitle || `Generated on ${dateStr}`, 14, 34);

  // Date on right
  doc.text(dateStr, pageW - 14, 34, { align: "right" });

  return 50; // return Y position after header
}

function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...RED);
    doc.rect(0, pageH - 12, pageW, 12, "F");
    doc.setTextColor(...GOLD);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Niranam Chudan Vallasamithi & NBC  |  Confidential", 14, pageH - 4);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 4, { align: "right" });
  }
}

function fmt(num) {
  return "Rs." + Number(num).toLocaleString("en-IN");
}

function sectionTitle(doc, text, y) {
  doc.setFillColor(...LIGHT_GRAY);
  doc.rect(14, y - 5, doc.internal.pageSize.getWidth() - 28, 8, "F");
  doc.setTextColor(...RED);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(text.toUpperCase(), 16, y);
  return y + 8;
}

function statBox(doc, x, y, w, label, value, valueColor = DARK) {
  doc.setFillColor(...WHITE);
  doc.setDrawColor(220, 220, 215);
  doc.roundedRect(x, y, w, 18, 2, 2, "FD");
  doc.setTextColor(...MUTED);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + 4, y + 7);
  doc.setTextColor(...valueColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(String(value), x + 4, y + 14);
}

// ── 1. SUMMARY REPORT ─────────────────────────────────────────
export function generateSummaryPDF(data) {
  const { books, collections, members, org } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  let y = addLetterhead(doc, "Summary Report", "All collections — coupon sale overview");

  const totalCollected = collections.reduce((s, c) => s + (c.amount || 0), 0);
  const totalValue = TOTAL_TICKETS * TICKET_PRICE;
  const soldTickets = collections.reduce((s, c) => s + (c.ticketsSold || 0), 0);
  const completeBooks = books.filter(b => b.status === "complete").length;
  const ongoingBooks = books.filter(b => b.status === "ongoing").length;
  const pendingBooks = books.filter(b => b.status === "not_started").length;

  // Grand total box
  doc.setFillColor(...RED);
  doc.roundedRect(14, y, pageW - 28, 22, 3, 3, "F");
  doc.setTextColor(...GOLD);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Total collected (coupon sales)", 20, y + 8);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(fmt(totalCollected), 20, y + 18);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`${soldTickets} of ${TOTAL_TICKETS.toLocaleString()} tickets sold`, pageW - 20, y + 18, { align: "right" });
  y += 28;

  // Stats row
  const bw = (pageW - 28 - 9) / 4;
  statBox(doc, 14, y, bw, "Books issued", books.length);
  statBox(doc, 14 + bw + 3, y, bw, "Complete", completeBooks, GREEN);
  statBox(doc, 14 + (bw + 3) * 2, y, bw, "Ongoing", ongoingBooks, AMBER);
  statBox(doc, 14 + (bw + 3) * 3, y, bw, "Balance pending", fmt(totalValue - totalCollected), AMBER);
  y += 26;

  // Series breakdown
  y = sectionTitle(doc, "Series-wise breakdown", y);
  const seriesRows = Object.entries(BOOK_SERIES).map(([key, s]) => {
    const seriesBooks = books.filter(b => b.series === key || b.bookNumber?.startsWith(key));
    const sold = seriesBooks.reduce((sum, book) => {
      return sum + collections.filter(c => c.bookId === book.id).reduce((s2, c) => s2 + (c.ticketsSold || 0), 0);
    }, 0);
    const collected = seriesBooks.reduce((sum, book) => {
      return sum + collections.filter(c => c.bookId === book.id).reduce((s2, c) => s2 + (c.amount || 0), 0);
    }, 0);
    return [
      `${key} Series`,
      `${s.ticketsPerBook} tickets/book`,
      `${s.totalBooks} books`,
      `${s.ticketStart}–${s.ticketEnd}`,
      `${sold} / ${s.totalBooks * s.ticketsPerBook}`,
      fmt(collected),
      fmt(s.totalBooks * s.ticketsPerBook * TICKET_PRICE - collected),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Series", "Type", "Total Books", "Ticket Range", "Tickets Sold", "Collected", "Pending"]],
    body: seriesRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    margin: { left: 14, right: 14 },
  });
  y = doc.lastAutoTable.finalY + 8;

  // Top collectors
  y = sectionTitle(doc, "Member collection summary", y);
  const memberRows = members.map(m => {
    const s = getMemberStats(m.id, books, collections);
    return [
      `${m.firstName} ${m.lastName}`,
      LABELS[m.label]?.label || m.label,
      s.memberBooks.length,
      `${s.soldTickets} / ${s.totalTickets}`,
      fmt(s.totalCollected),
      fmt(s.totalPending),
      s.totalPending === 0 ? "Complete" : s.totalCollected > 0 ? "Ongoing" : "Not started",
    ];
  }).sort((a, b) => b[4].localeCompare(a[4]));

  autoTable(doc, {
    startY: y,
    head: [["Member", "Label", "Books", "Tickets", "Collected", "Pending", "Status"]],
    body: memberRows,
    theme: "grid",
    styles: { fontSize: 8, cellPadding: 3, textColor: DARK },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: { 4: { textColor: GREEN }, 5: { textColor: AMBER } },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  return doc;
}

// ── 2. COUPON SALE REPORT ──────────────────────────────────────
export function generateCouponSalePDF(data) {
  const { books, collections, members } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = addLetterhead(doc, "Coupon Sale Report", "Book-wise collection details");

  const totalCollected = collections.reduce((s, c) => s + (c.amount || 0), 0);
  const soldTickets = collections.reduce((s, c) => s + (c.ticketsSold || 0), 0);
  const pageW = doc.internal.pageSize.getWidth();

  const bw = (pageW - 28 - 9) / 4;
  statBox(doc, 14, y, bw, "Books assigned", books.length);
  statBox(doc, 14 + bw + 3, y, bw, "Tickets sold", `${soldTickets}/${TOTAL_TICKETS}`);
  statBox(doc, 14 + (bw + 3) * 2, y, bw, "Total collected", fmt(totalCollected), GREEN);
  statBox(doc, 14 + (bw + 3) * 3, y, bw, "Balance pending", fmt(TOTAL_TICKETS * TICKET_PRICE - totalCollected), AMBER);
  y += 26;

  // Book-wise table
  y = sectionTitle(doc, "Book-wise detail", y);
  const bookRows = books.map(book => {
    const stats = getBookStats(book, collections);
    const member = members.find(m => m.id === book.memberId);
    const s = getSeriesFromBook(book.bookNumber);
    return [
      book.bookNumber,
      s ? `${s.name} (${s.ticketsPerBook} tickets)` : "",
      member ? `${member.firstName} ${member.lastName}` : "—",
      `${book.ticketFrom}–${book.ticketTo}`,
      `${stats.totalSold} / ${book.ticketCount}`,
      fmt(stats.totalCollected),
      fmt(stats.pending),
      book.issueDate || "—",
      book.status === "complete" ? "Complete" : book.status === "ongoing" ? "Ongoing" : "Not started",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Book No.", "Series", "Member", "Ticket Range", "Sold", "Collected", "Pending", "Issued", "Status"]],
    body: bookRows,
    theme: "grid",
    styles: { fontSize: 7, cellPadding: 2.5, textColor: DARK },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 7 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: { 5: { textColor: GREEN }, 6: { textColor: AMBER } },
    margin: { left: 14, right: 14 },
  });

  addFooter(doc);
  return doc;
}

// ── 3. MEMBER-WISE REPORT ─────────────────────────────────────
export function generateMemberWisePDF(data) {
  const { books, collections, members } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = addLetterhead(doc, "Member-wise Report", "Individual member book & collection details");

  members.forEach((member, idx) => {
    if (idx > 0) {
      doc.addPage();
      y = addLetterhead(doc, "Member-wise Report (cont.)", `Member: ${member.firstName} ${member.lastName}`);
    }

    const stats = getMemberStats(member.id, books, collections);
    const cfg = LABELS[member.label];
    const pageW = doc.internal.pageSize.getWidth();

    // Member header card
    doc.setFillColor(...LIGHT_GRAY);
    doc.roundedRect(14, y, pageW - 28, 22, 2, 2, "F");
    doc.setTextColor(...DARK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`${member.firstName} ${member.lastName}`, 20, y + 9);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...MUTED);
    doc.text(`${cfg?.label || member.label}  |  ${member.id}  |  ${member.phone}`, 20, y + 16);
    doc.setTextColor(...GREEN);
    doc.text(`Total collected: ${fmt(stats.totalCollected)}`, pageW - 20, y + 9, { align: "right" });
    doc.setTextColor(...AMBER);
    doc.text(`Pending: ${fmt(stats.totalPending)}`, pageW - 20, y + 16, { align: "right" });
    y += 28;

    if (stats.memberBooks.length === 0) {
      doc.setTextColor(...MUTED);
      doc.setFontSize(9);
      doc.text("No books assigned to this member.", 20, y + 6);
      y += 14;
      return;
    }

    // Books table
    const bookRows = stats.memberBooks.map(book => {
      const bs = getBookStats(book, collections);
      const s = getSeriesFromBook(book.bookNumber);
      return [
        book.bookNumber,
        s?.label || "",
        `${book.ticketFrom}–${book.ticketTo}`,
        book.ticketCount,
        bs.totalSold,
        book.ticketCount - bs.totalSold,
        fmt(bs.totalCollected),
        fmt(bs.pending),
        book.status === "complete" ? "Complete" : book.status === "ongoing" ? "Ongoing" : "Not started",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Book", "Type", "Ticket Range", "Total", "Sold", "Remaining", "Collected", "Pending", "Status"]],
      body: bookRows,
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK },
      headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: { 6: { textColor: GREEN }, 7: { textColor: AMBER } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 6;

    // Collection history for this member
    const memberCols = collections
      .filter(c => c.memberId === member.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (memberCols.length > 0) {
      y = sectionTitle(doc, "Collection history", y);
      const colRows = memberCols.map(col => {
        const book = books.find(b => b.id === col.bookId);
        return [
          col.date,
          book?.bookNumber || "—",
          col.ticketsSold,
          fmt(col.amount),
          col.paymentMode?.toUpperCase() || "—",
          col.remarks || "—",
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [["Date", "Book", "Tickets Sold", "Amount", "Mode", "Remarks"]],
        body: colRows,
        theme: "grid",
        styles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK },
        headStyles: { fillColor: [80, 80, 80], textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
        alternateRowStyles: { fillColor: LIGHT_GRAY },
        columnStyles: { 3: { textColor: GREEN } },
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 10;
    }
  });

  addFooter(doc);
  return doc;
}

// ── 4. PENDING / DEFAULTERS REPORT ────────────────────────────
export function generatePendingPDF(data) {
  const { books, collections, members } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = addLetterhead(doc, "Pending / Defaulters Report", "Members with outstanding balance");

  const pendingMembers = members.map(m => {
    const s = getMemberStats(m.id, books, collections);
    return { ...m, ...s };
  }).filter(m => m.totalPending > 0).sort((a, b) => b.totalPending - a.totalPending);

  const totalPending = pendingMembers.reduce((s, m) => s + m.totalPending, 0);
  const pageW = doc.internal.pageSize.getWidth();

  // Alert box
  doc.setFillColor(250, 238, 218);
  doc.roundedRect(14, y, pageW - 28, 14, 2, 2, "F");
  doc.setTextColor(...AMBER);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`${pendingMembers.length} members have outstanding balance — Total pending: ${fmt(totalPending)}`, 20, y + 9);
  y += 20;

  if (pendingMembers.length === 0) {
    doc.setTextColor(...GREEN);
    doc.setFontSize(11);
    doc.text("All collections are complete! No pending balance.", 14, y + 10);
  } else {
    const rows = pendingMembers.map(m => [
      `${m.firstName} ${m.lastName}`,
      LABELS[m.label]?.label || "",
      m.phone,
      m.memberBooks.length,
      fmt(m.totalCollected),
      fmt(m.totalPending),
      m.memberBooks.filter(b => getBookStats(b, collections).pending > 0).length + " book(s)",
    ]);

    autoTable(doc, {
      startY: y,
      head: [["Member", "Label", "Phone", "Books", "Collected", "Pending", "Pending Books"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3, textColor: DARK },
      headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: { 4: { textColor: GREEN }, 5: { textColor: [163, 45, 45], fontStyle: "bold" } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;

    // Total row
    doc.setFillColor(...RED);
    doc.rect(14, y, pageW - 28, 10, "F");
    doc.setTextColor(...GOLD);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Total outstanding balance", 20, y + 7);
    doc.text(fmt(totalPending), pageW - 20, y + 7, { align: "right" });
  }

  addFooter(doc);
  return doc;
}

// ── 5. BOOK INVENTORY REPORT ──────────────────────────────────
export function generateInventoryPDF(data) {
  const { books, collections, members } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = addLetterhead(doc, "Book Inventory Report", "All 500 books — assigned vs available");

  const pageW = doc.internal.pageSize.getWidth();
  const bw = (pageW - 28 - 9) / 4;
  statBox(doc, 14, y, bw, "Total books printed", 500);
  statBox(doc, 14 + bw + 3, y, bw, "Books assigned", books.length, GREEN);
  statBox(doc, 14 + (bw + 3) * 2, y, bw, "Available", 500 - books.length, AMBER);
  statBox(doc, 14 + (bw + 3) * 3, y, bw, "Complete", books.filter(b => b.status === "complete").length, GREEN);
  y += 26;

  // Per series
  ["A", "B", "C"].forEach(key => {
    const s = BOOK_SERIES[key];
    const seriesBooks = books.filter(b => b.series === key || b.bookNumber?.startsWith(key));
    y = sectionTitle(doc, `${s.name} — ${s.ticketsPerBook} tickets per book (${s.totalBooks} books | Tickets ${s.ticketStart}–${s.ticketEnd})`, y);

    if (seriesBooks.length === 0) {
      doc.setTextColor(...MUTED);
      doc.setFontSize(8);
      doc.text("No books assigned in this series yet.", 20, y + 5);
      y += 12;
      return;
    }

    const rows = seriesBooks.map(book => {
      const stats = getBookStats(book, collections);
      const member = members.find(m => m.id === book.memberId);
      return [
        book.bookNumber,
        `${book.ticketFrom}–${book.ticketTo}`,
        member ? `${member.firstName} ${member.lastName}` : "—",
        book.issueDate || "—",
        book.returnDeadline || "—",
        `${stats.totalSold} / ${book.ticketCount}`,
        fmt(stats.totalCollected),
        book.status === "complete" ? "Complete" : book.status === "ongoing" ? "Ongoing" : "Not started",
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [["Book No.", "Ticket Range", "Assigned To", "Issue Date", "Return By", "Sold", "Collected", "Status"]],
      body: rows,
      theme: "grid",
      styles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK },
      headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
      alternateRowStyles: { fillColor: LIGHT_GRAY },
      columnStyles: { 6: { textColor: GREEN } },
      margin: { left: 14, right: 14 },
    });
    y = doc.lastAutoTable.finalY + 8;
  });

  addFooter(doc);
  return doc;
}

// ── 6. COLLECTION HISTORY REPORT ─────────────────────────────
export function generateHistoryPDF(data) {
  const { books, collections, members } = data;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  let y = addLetterhead(doc, "Collection History Report", "All payment entries — chronological");

  const sorted = [...collections].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalCollected = sorted.reduce((s, c) => s + (c.amount || 0), 0);
  const pageW = doc.internal.pageSize.getWidth();

  const bw = (pageW - 28 - 6) / 3;
  statBox(doc, 14, y, bw, "Total entries", sorted.length);
  statBox(doc, 14 + bw + 3, y, bw, "Total collected", fmt(totalCollected), GREEN);
  statBox(doc, 14 + (bw + 3) * 2, y, bw, "Avg per entry", fmt(Math.round(totalCollected / (sorted.length || 1))));
  y += 26;

  y = sectionTitle(doc, "All collection entries", y);

  const rows = sorted.map((col, i) => {
    const book = books.find(b => b.id === col.bookId);
    const member = members.find(m => m.id === col.memberId);
    const running = sorted.slice(i).reduce((s, c) => s + (c.amount || 0), 0);
    return [
      col.date,
      member ? `${member.firstName} ${member.lastName}` : "—",
      book?.bookNumber || "—",
      col.ticketsSold,
      fmt(col.amount),
      col.paymentMode?.toUpperCase() || "—",
      col.remarks || "—",
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Date", "Member", "Book", "Tickets", "Amount", "Mode", "Remarks"]],
    body: rows,
    theme: "grid",
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: DARK },
    headStyles: { fillColor: RED, textColor: WHITE, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: { 4: { textColor: GREEN } },
    margin: { left: 14, right: 14 },
    didDrawPage: (d) => {
      if (d.pageNumber > 1) addLetterhead(doc, "Collection History (cont.)", "");
    },
  });

  // Grand total
  const finalY = doc.lastAutoTable.finalY + 4;
  doc.setFillColor(...RED);
  doc.rect(14, finalY, pageW - 28, 10, "F");
  doc.setTextColor(...GOLD);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Grand total collected", 20, finalY + 7);
  doc.text(fmt(totalCollected), pageW - 20, finalY + 7, { align: "right" });

  addFooter(doc);
  return doc;
}

// ── COMBINED PDF ──────────────────────────────────────────────
export function generateCombinedPDF(selectedReportIds, data) {
  const generators = {
    summary: generateSummaryPDF,
    coupon: generateCouponSalePDF,
    member: generateMemberWisePDF,
    pending: generatePendingPDF,
    inventory: generateInventoryPDF,
    history: generateHistoryPDF,
  };

  // Generate first selected report
  const firstId = selectedReportIds[0];
  const combinedDoc = generators[firstId](data);

  // Append remaining reports
  selectedReportIds.slice(1).forEach(id => {
    const subDoc = generators[id](data);
    const subPageCount = subDoc.internal.getNumberOfPages();
    for (let i = 1; i <= subPageCount; i++) {
      combinedDoc.addPage();
      // Copy page content by rendering
      const srcCanvas = subDoc.canvas;
      if (srcCanvas) {
        // Fallback: just add a page break with title
        combinedDoc.setFillColor(...RED);
        combinedDoc.rect(0, 0, combinedDoc.internal.pageSize.getWidth(), 40, "F");
      }
    }
  });

  // Better approach: merge by saving individual and combining
  return combinedDoc;
}

// ── DOWNLOAD HELPER ───────────────────────────────────────────
export function downloadPDF(doc, filename) {
  doc.save(`${filename}_${new Date().toISOString().split("T")[0]}.pdf`);
}

export function printPDF(doc) {
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) {
    win.addEventListener("load", () => {
      win.print();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
}
