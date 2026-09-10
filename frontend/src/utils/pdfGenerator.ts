import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type for autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

export interface InvoiceData {
  invoice_id: string;
  date: string;
  period: string;
  payment_id?: string;
  order_id?: string;
  customer_name?: string;
  customer_email?: string;
  services: {
    name: string;
    amount: number;
  }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
}

// ─── Color palette ────────────────────────────────────────────
const NAVY   = [15, 32, 56]   as const;
const GOLD   = [198, 146, 59] as const;
const WHITE  = [255, 255, 255] as const;
const BODY   = [15, 23, 42]   as const;
const MUTED  = [100, 116, 139] as const;
const LIGHT  = [241, 245, 249] as const;
const BORDER = [226, 232, 240] as const;
const GREEN  = [5, 150, 105]  as const;
const GREEN_BG = [236, 253, 245] as const;
const BLUE   = [37, 99, 235]  as const;

// ─── Helpers ──────────────────────────────────────────────────
const formatINR = (amount: number): string =>
  '\u20B9' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';
  const whole = Math.floor(Math.abs(n));
  const paise = Math.round((Math.abs(n) - whole) * 100);
  let result = convertWholeToWords(whole);
  if (paise > 0) result += ` and ${convertWholeToWords(paise)} Paise`;
  return result + ' Only';
}

function convertWholeToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertWholeToWords(n % 100) : '');
  if (n < 100000) return convertWholeToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertWholeToWords(n % 1000) : '');
  if (n < 10000000) return convertWholeToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convertWholeToWords(n % 100000) : '');
  return convertWholeToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convertWholeToWords(n % 10000000) : '');
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Main Generator ───────────────────────────────────────────
export const generateInvoicePDF = (data: InvoiceData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();   // 297
  const M = 15;   // margin
  const contentW = W - M * 2;
  let y = 0;

  // ═══════════════════════════════════════════════════════════
  // 1. HEADER BANNER
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 42, 'F');

  // Gold accent line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);
  doc.line(0, 42, W, 42);

  // Company name
  doc.setTextColor(...WHITE);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ARAVANTA CLOUDOS', M, 17);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 200, 230);
  doc.text('Enterprise Cloud Infrastructure Platform', M, 24);

  // TAX INVOICE
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('TAX INVOICE', W - M, 18, { align: 'right' });

  doc.setFontSize(8);
  doc.setTextColor(180, 200, 230);
  doc.setFont('helvetica', 'normal');
  doc.text('Original for Recipient', W - M, 26, { align: 'right' });

  // ═══════════════════════════════════════════════════════════
  // 2. FROM / BILL TO  (two columns)
  // ═══════════════════════════════════════════════════════════
  y = 50;
  const colW = (contentW - 8) / 2;

  // FROM box
  doc.setFillColor(...LIGHT);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, colW, 40, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('FROM:', M + 4, y + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BODY);
  doc.text('Aravanta CloudOS Inc.', M + 4, y + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  const fromLines = [
    'CIN: U72200MH2026PTC000001',
    'GSTIN: 27AAAAA0000A1Z5 | SAC: 998313',
    'billing@aravanta.cloud',
    'Mumbai, Maharashtra, India 400001'
  ];
  fromLines.forEach((line, i) => {
    doc.text(line, M + 4, y + 18 + i * 5);
  });

  // BILL TO box
  const rightX = M + colW + 8;
  doc.setFillColor(...LIGHT);
  doc.roundedRect(rightX, y, colW, 40, 2, 2, 'FD');

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE);
  doc.text('BILL TO:', rightX + 4, y + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BODY);
  doc.text(data.customer_name || 'Aravanta Cloud User', rightX + 4, y + 12);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(data.customer_email || 'developer@aravanta.cloud', rightX + 4, y + 18);
  doc.text('Region: ap-south-1 (Mumbai)', rightX + 4, y + 23);

  // ═══════════════════════════════════════════════════════════
  // 3. INVOICE METADATA GRID
  // ═══════════════════════════════════════════════════════════
  y = 96;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...BORDER);
  doc.roundedRect(M, y, contentW, 22, 2, 2, 'FD');

  const metaW = contentW / 4;
  const metaItems = [
    { label: 'INVOICE NUMBER', value: data.invoice_id },
    { label: 'INVOICE DATE', value: data.date },
    { label: 'BILLING PERIOD', value: data.period },
    { label: 'DUE DATE', value: addDays(data.date, 30) },
  ];

  metaItems.forEach((item, i) => {
    const x = M + i * metaW + 4;
    // Vertical dividers
    if (i > 0) {
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.3);
      doc.line(M + i * metaW, y + 3, M + i * metaW, y + 19);
    }
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED);
    doc.text(item.label, x, y + 7);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BODY);
    doc.text(item.value || '-', x, y + 14);
  });

  // ═══════════════════════════════════════════════════════════
  // 4. LINE ITEMS TABLE
  // ═══════════════════════════════════════════════════════════
  y = 124;

  const tableData = data.services.map((svc, idx) => [
    (idx + 1).toString(),
    svc.name,
    '998313',
    '1',
    formatINR(svc.amount),
    formatINR(svc.amount)
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Service Description', 'HSN/SAC', 'Qty', 'Unit Price (\u20B9)', 'Amount (\u20B9)']],
    body: tableData,
    margin: { left: M, right: M },
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineColor: [...BORDER],
      lineWidth: 0.3,
      textColor: [...BODY],
    },
    headStyles: {
      fillColor: [...NAVY],
      textColor: [...WHITE],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center', fontSize: 7.5 },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  y = doc.lastAutoTable.finalY + 6;

  // ═══════════════════════════════════════════════════════════
  // 5. TAX BREAKDOWN & TOTALS (right-aligned)
  // ═══════════════════════════════════════════════════════════
  const totalsX = W - M - 80;

  const drawRow = (label: string, value: string, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...MUTED);
    doc.text(label, totalsX, y);
    doc.setTextColor(...BODY);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(value, W - M, y, { align: 'right' });
    y += 6;
  };

  drawRow('Subtotal:', formatINR(data.subtotal));
  drawRow('CGST (9%):', formatINR(data.cgst));
  drawRow('SGST (9%):', formatINR(data.sgst));

  // Gold divider
  y += 1;
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.8);
  doc.line(totalsX - 2, y, W - M, y);
  y += 6;

  // Grand Total box
  const boxH = 14;
  doc.setFillColor(...NAVY);
  doc.roundedRect(totalsX - 4, y - 4, W - M - totalsX + 4, boxH, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('GRAND TOTAL (INCL. GST):', totalsX, y + 3);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(formatINR(data.total), W - M - 3, y + 4, { align: 'right' });

  y += boxH + 3;

  // Amount in words
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...MUTED);
  doc.text(`Amount in words: Indian Rupees ${numberToWords(data.total)}`, M, y);
  y += 8;

  // ═══════════════════════════════════════════════════════════
  // 6. PAYMENT CONFIRMATION
  // ═══════════════════════════════════════════════════════════
  if (data.payment_id) {
    doc.setFillColor(...GREEN_BG);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(M, y, contentW, 20, 2, 2, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('\u2713  PAYMENT CONFIRMED', M + 5, y + 7);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Transaction ID: ${data.payment_id}`, M + 5, y + 12.5);
    if (data.order_id) {
      doc.text(`Order ID: ${data.order_id}`, M + 80, y + 12.5);
    }
    doc.text('Status: PAID & SETTLED', W - M - 5, y + 7, { align: 'right' });

    y += 26;
  }

  // ═══════════════════════════════════════════════════════════
  // 7. TERMS & CONDITIONS
  // ═══════════════════════════════════════════════════════════
  if (y < H - 70) {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BODY);
    doc.text('TERMS & CONDITIONS', M, y);
    y += 5;

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);

    const terms = [
      '1. Payment is due within 30 days from the date of invoice unless otherwise agreed in writing.',
      '2. Late payments are subject to interest at 1.5% per month on the outstanding balance.',
      '3. Cloud subscriptions auto-renew at the end of each billing cycle unless cancelled 7 days prior.',
      '4. Technical support is available 24/7 via support@aravanta.cloud for all active subscriptions.',
      '5. Any disputes must be raised within 15 days of the invoice date. Subject to Mumbai jurisdiction.',
    ];
    terms.forEach((t) => {
      doc.text(t, M, y);
      y += 4;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // 8. FOOTER
  // ═══════════════════════════════════════════════════════════
  y = H - 28;
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 5;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated invoice and does not require a physical signature.', M, y);
  y += 4;
  doc.text('Aravanta CloudOS Inc. \u2022 CIN: U72200MH2026PTC000001 \u2022 GSTIN: 27AAAAA0000A1Z5 \u2022 support@aravanta.cloud', M, y);
  y += 4;
  const genTs = new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' });
  doc.text(`Generated on: ${genTs}`, M, y);

  // Digital signature (right-aligned)
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...BLUE);
  doc.text('Digitally Signed by Aravanta CloudOS Billing Engine', W - M, y - 4, { align: 'right' });

  // Page number
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Page 1 of 1', W - M, y, { align: 'right' });

  // ─── Save & Download ─────────────────────────────────────
  doc.save(`Aravanta_Invoice_${data.invoice_id}.pdf`);
};
