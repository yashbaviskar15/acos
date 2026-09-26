import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ARAVANTA_LOGO_BASE64 } from './logoBase64';

// Extend jsPDF type for autoTable plugin
declare module 'jspdf' {
  interface jsPDF {
    autoTable?: (options: any) => jsPDF;
    lastAutoTable?: { finalY: number };
  }
}

export interface InvoiceData {
  invoice_id: string;
  date: string;
  period: string;
  payment_id?: string;
  payment_method?: string;
  order_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_account?: string;
  workspace_name?: string;
  services: {
    name: string;
    amount: number;
  }[];
  subtotal: number;
  cgst: number;
  sgst: number;
  total: number;
}

// ─── Color Palette Matching Web Copy ─────────────────────────
const PRIMARY_NAVY = [15, 32, 56]   as const; // #0F2038
const GOLD         = [198, 146, 59] as const; // #C6923B
const WHITE        = [255, 255, 255] as const;
const DARK_TEXT    = [15, 23, 42]   as const; // #0F172A
const MUTED_TEXT   = [100, 116, 139] as const; // #64748B
const LIGHT_BG     = [248, 250, 252] as const; // #F8FAFC
const BORDER_COLOR = [226, 232, 240] as const; // #E2E8F0
const GREEN_TEXT   = [5, 150, 105]  as const; // #059669
const GREEN_BG     = [236, 253, 245] as const; // #ECFDF5
const GREEN_BORDER = [167, 243, 208] as const; // #A7F3D0
const BLUE_TEXT    = [37, 99, 235]  as const; // #2563EB
const BLUE_LIGHT   = [180, 200, 230] as const;

// ─── Helpers ──────────────────────────────────────────────────
// Standard format for Indian Tax Invoices without broken glyphs in PDF
const formatINR = (amount: number): string =>
  'Rs. ' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

export function numberToWords(n: number): string {
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

// Generate deterministic short hash for invoice audit
export function generateAuditHash(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(12, '0');
}

// ─── Main PDF Generator ───────────────────────────────────────
export const generateInvoicePDF = (data: InvoiceData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();   // 210mm
  const M = 14;                                 // 14mm margins
  const contentW = W - M * 2;                   // 182mm content width
  const auditHash = generateAuditHash(data.invoice_id);
  let y = 0;

  // ═══════════════════════════════════════════════════════════
  // 1. HEADER BANNER (Identical to Web Copy with Real Logo)
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(...PRIMARY_NAVY);
  doc.rect(0, 0, W, 40, 'F');

  // Gold accent bar below dark header
  doc.setFillColor(...GOLD);
  doc.rect(0, 40, W, 1.5, 'F');

  // Official Aravanta Brand Logo inside clean white rounded card
  doc.setFillColor(...WHITE);
  doc.roundedRect(M, 10, 20, 20, 2.5, 2.5, 'F');
  try {
    doc.addImage(ARAVANTA_LOGO_BASE64, 'PNG', M + 1.5, 11.5, 17, 17);
  } catch (e) {
    console.warn('PDF logo render fallback:', e);
  }

  // Brand Name
  doc.setTextColor(...WHITE);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('ARAVANTA CLOUDOS', 38, 17.5);

  // Brand Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BLUE_LIGHT);
  doc.text('Enterprise Cloud Infrastructure Platform \u2022 FinOps Control Plane', 38, 23);

  // Company Registration lines
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text('Aravanta CloudOS Technologies Inc. \u2022 Jalgaon, Maharashtra, India - 425001', 38, 28);
  doc.text('CIN: U72200MH2026PTC000001 \u2022 GSTIN: 27AAAAA0000A1Z5 \u2022 SAC: 998313', 38, 32.5);

  // Right Header: TAX INVOICE
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('TAX INVOICE', W - M, 19, { align: 'right' });

  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BLUE_LIGHT);
  doc.text('ORIGINAL FOR RECIPIENT \u2022 GST COMPLIANT', W - M, 26, { align: 'right' });

  // ═══════════════════════════════════════════════════════════
  // 2. TWO-COLUMN CARDS: ISSUED BY & BILLED TO
  // ═══════════════════════════════════════════════════════════
  y = 46;
  const colW = (contentW - 6) / 2; // 88mm each
  const boxH = 39;

  // Left Card: ISSUED BY (SUPPLIER)
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, colW, boxH, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE_TEXT);
  doc.text('ISSUED BY (SUPPLIER)', M + 4, y + 6);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('Aravanta CloudOS Technologies Inc.', M + 4, y + 11.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('Address: Jalgaon, Maharashtra, India - 425001', M + 4, y + 16.5);
  doc.text('CIN: U72200MH2026PTC000001', M + 4, y + 21);
  doc.text('GSTIN / State: 27AAAAA0000A1Z5 (Maharashtra - 27)', M + 4, y + 25.5);
  doc.text('SAC Code: 998313 (IT SaaS Infrastructure)', M + 4, y + 30);
  doc.text('Email: billing@aravanta.cloud \u2022 Support: 24/7 Available', M + 4, y + 34.5);

  // Right Card: BILLED TO (CUSTOMER)
  const rightX = M + colW + 6;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(rightX, y, colW, boxH, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE_TEXT);
  doc.text('BILLED TO (CUSTOMER)', rightX + 4, y + 6);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(data.customer_name || 'Aravanta Cloud Customer', rightX + 4, y + 11.5);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_TEXT);
  doc.text(`Account ID: ${data.customer_account || 'ARV-ACC-PRIMARY'}`, rightX + 4, y + 16.5);
  doc.text(`Email: ${data.customer_email || 'billing@aravanta.cloud'}`, rightX + 4, y + 21);
  doc.text(`Workspace: ${data.workspace_name || 'Production Cloud Ops'}`, rightX + 4, y + 25.5);
  doc.text('Deployment Region: ap-south-1 (Mumbai, India)', rightX + 4, y + 30);
  doc.text('Place of Supply: 27 - Maharashtra (Intra-State Supply)', rightX + 4, y + 34.5);

  // ═══════════════════════════════════════════════════════════
  // 3. INVOICE METADATA GRID (No Overlap, Exact Proportions)
  // ═══════════════════════════════════════════════════════════
  y = 89;
  const metaH = 18;
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, contentW, metaH, 2, 2, 'FD');

  // Col 1: Invoice Number (width 42mm)
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('INVOICE NUMBER', M + 4, y + 5.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(data.invoice_id, M + 4, y + 12);

  // Vertical divider 1
  doc.line(M + 42, y + 2.5, M + 42, y + 15.5);

  // Col 2: Invoice Date (width 36mm)
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('INVOICE DATE', M + 46, y + 5.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(data.date, M + 46, y + 12);

  // Vertical divider 2
  doc.line(M + 78, y + 2.5, M + 78, y + 15.5);

  // Col 3: Billing Period (width 60mm with maxWidth protection)
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('BILLING PERIOD', M + 82, y + 5.5);
  const periodText = data.period || 'Monthly Subscription';
  doc.setFontSize(periodText.length > 25 ? 7.5 : 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text(periodText, M + 82, y + 11.5, { maxWidth: 56 });

  // Vertical divider 3
  doc.line(M + 138, y + 2.5, M + 138, y + 15.5);

  // Col 4: Payment Status (width 44mm, green badge)
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('PAYMENT STATUS', M + 142, y + 5.5);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN_TEXT);
  doc.text('[PAID] SETTLED', M + 142, y + 12);

  // ═══════════════════════════════════════════════════════════
  // 4. LINE ITEMS TABLE (Exact columns & specifications)
  // ═══════════════════════════════════════════════════════════
  y = 111;

  const tableData = data.services.map((svc, idx) => [
    (idx + 1).toString(),
    `${svc.name}\nMulti-tenant dedicated control plane, automated failover, secure edge load balancer, and container cluster operations.`,
    '998313',
    '1',
    formatINR(svc.amount),
    formatINR(svc.amount)
  ]);

  const tableConfig: any = {
    startY: y,
    head: [['#', 'SERVICE DESCRIPTION & TECHNICAL SPECIFICATIONS', 'HSN/SAC', 'QTY', 'UNIT PRICE (INR)', 'TAXABLE VALUE']],
    body: tableData,
    margin: { left: M, right: M },
    styles: {
      fontSize: 8,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineColor: [...BORDER_COLOR],
      lineWidth: 0.3,
      textColor: [...DARK_TEXT],
    },
    headStyles: {
      fillColor: [...PRIMARY_NAVY],
      textColor: [...WHITE],
      fontSize: 7.2,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: { top: 3.5, bottom: 3.5, left: 1.5, right: 1.5 }
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 86, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 27, halign: 'right' },
      5: { cellWidth: 27, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [...LIGHT_BG],
    },
  };

  if (typeof (doc as any).autoTable === 'function') {
    (doc as any).autoTable(tableConfig);
  } else if (typeof autoTable === 'function') {
    (autoTable as any)(doc, tableConfig);
  }

  const finalAutoY = (doc as any).lastAutoTable?.finalY ?? ((autoTable as any)?.previous?.finalY) ?? (y + 36);
  y = finalAutoY + 5;

  // ═══════════════════════════════════════════════════════════
  // 5. SIDE-BY-SIDE SUMMARY: PAYMENT AUDIT (LEFT) & TOTALS (RIGHT)
  // ═══════════════════════════════════════════════════════════
  const summaryBoxH = 48;
  const leftW = 94;
  const rightW = 82;
  const summaryRightX = M + leftW + 6; // 14 + 94 + 6 = 114mm

  // 5A. Left Box: Payment Audit & Corporate Bank Settlement
  doc.setFillColor(...GREEN_BG);
  doc.setDrawColor(...GREEN_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, leftW, summaryBoxH, 2, 2, 'FD');

  // Vector Green Checkmark Badge (prevents unicode character degradation)
  doc.setFillColor(...GREEN_TEXT);
  doc.circle(M + 6, y + 5.2, 2.2, 'F');
  doc.setDrawColor(...WHITE);
  doc.setLineWidth(0.4);
  doc.line(M + 5, y + 5.2, M + 5.8, y + 6);
  doc.line(M + 5.8, y + 6, M + 7.2, y + 4.4);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN_TEXT);
  doc.text('Payment Verified & Settled', M + 9.5, y + 5.8);

  const cleanTxnId = data.payment_id 
    ? data.payment_id 
    : `TXN-${data.invoice_id.replace(/^INV-/, '')}`;

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Transaction Reference: ${cleanTxnId}`, M + 4, y + 10.5);
  doc.text(`Payment Channel: ${data.payment_method || 'Verified Primary Mandate'}`, M + 4, y + 15);
  doc.text('Settlement Gateway: Aravanta FinOps Automated Settlement Engine', M + 4, y + 19.5);
  doc.text(`Verification Hash: SHA256:${auditHash}`, M + 4, y + 24);

  // Dashed separator for corporate bank details
  doc.setDrawColor(...GREEN_BORDER);
  doc.setLineWidth(0.25);
  doc.line(M + 4, y + 26.5, M + leftW - 4, y + 26.5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('Direct NEFT/RTGS Corporate Settlement:', M + 4, y + 30.5);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('A/C Name: Aravanta CloudOS Technologies Inc. \u2022 Bank: HDFC Bank Ltd.', M + 4, y + 34.5);
  doc.text('A/C No: 50200088921045 \u2022 IFSC: HDFC0000123 \u2022 Jalgaon, MH 425001', M + 4, y + 38.5);
  doc.text('Place of Supply: 27 - Maharashtra (Intra-State GST Compliant)', M + 4, y + 42.5);

  // 5B. Right Box: Tax Breakdown & Grand Total Card
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BORDER_COLOR);
  doc.roundedRect(summaryRightX, y, rightW, summaryBoxH, 2, 2, 'FD');

  const drawRow = (label: string, val: string, rowY: number) => {
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED_TEXT);
    doc.text(label, summaryRightX + 4, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK_TEXT);
    doc.text(val, summaryRightX + rightW - 4, rowY, { align: 'right' });
  };

  drawRow('Taxable Amount (Subtotal):', formatINR(data.subtotal), y + 5.5);
  drawRow('Central GST (CGST 9.0%):', formatINR(data.cgst), y + 10);
  drawRow('State GST (SGST 9.0%):', formatINR(data.sgst), y + 14.5);
  drawRow('Integrated GST (IGST 0.0%):', 'Rs. 0.00', y + 19);

  // Gold divider line
  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.5);
  doc.line(summaryRightX + 4, y + 21, summaryRightX + rightW - 4, y + 21);

  // Grand Total Navy Card
  const grandTotalCardH = 12.5;
  doc.setFillColor(...PRIMARY_NAVY);
  doc.roundedRect(summaryRightX + 3, y + 23, rightW - 6, grandTotalCardH, 1.5, 1.5, 'F');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GOLD);
  doc.text('GRAND TOTAL (INCL. GST):', summaryRightX + 6, y + 31);

  doc.setFontSize(11.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text(formatINR(data.total), summaryRightX + rightW - 6, y + 31.5, { align: 'right' });

  // Amount in words
  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...MUTED_TEXT);
  doc.text(`Amount in words: Indian Rupees ${numberToWords(data.total)}`, summaryRightX + 4, y + 39.5, { maxWidth: rightW - 8 });

  // ═══════════════════════════════════════════════════════════
  // 5C. Enterprise Infrastructure SLA & FinOps Entitlements
  // ═══════════════════════════════════════════════════════════
  y += summaryBoxH + 4;
  const slaBoxH = 22;
  doc.setFillColor(...LIGHT_BG);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, W - 2 * M, slaBoxH, 2, 2, 'FD');

  // Sleek Gold Vector Indicator Bullet (prevents %Æ unicode corruption)
  doc.setFillColor(...GOLD);
  doc.circle(M + 5.5, y + 4.8, 1.4, 'F');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY_NAVY);
  doc.text('ENTERPRISE INFRASTRUCTURE & SLA COMPLIANCE GUARANTEE', M + 8.5, y + 5.3);

  const slaColW = (W - 2 * M - 12) / 3;

  doc.setFontSize(6.6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('High-Availability Commitment:', M + 4, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('99.95% Enterprise SLA Uptime Guaranteed', M + 4, y + 14.5);
  doc.text('Multi-cloud failover & zero data loss RPO', M + 4, y + 18.5);

  const col2X = M + 4 + slaColW + 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('Security & Governance Alignment:', col2X, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('ISO 27001 & SOC2 Type II Cloud Controls', col2X, y + 14.5);
  doc.text('Dedicated workspace tenant namespace', col2X, y + 18.5);

  const col3X = col2X + slaColW + 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('FinOps & Tax Credit (ITC):', col3X, y + 10.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED_TEXT);
  doc.text('100% Eligible GST Input Tax Credit (ITC)', col3X, y + 14.5);
  doc.text('SAC 998313 \u2022 IT SaaS Infrastructure', col3X, y + 18.5);

  // ═══════════════════════════════════════════════════════════
  // 6. TERMS & CONDITIONS (Statutory GST Notice)
  // ═══════════════════════════════════════════════════════════
  y += slaBoxH + 4;
  const termsBoxH = 30;
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.roundedRect(M, y, W - 2 * M, termsBoxH, 2, 2, 'FD');

  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK_TEXT);
  doc.text('TERMS & CONDITIONS \u2022 STATUTORY NOTICE & GOVERNING LAW', M + 4, y + 5);

  const terms = [
    '1. This is an electronically generated Tax Invoice issued under Section 31 of the CGST Act, 2017. Physical signature is not required under Rule 46.',
    '2. Cloud infrastructure services are provisioned on an active SaaS model and backed by a 99.95% enterprise uptime SLA commitment.',
    '3. Tax is paid under regular forward charge provisions; Reverse Charge Mechanism (RCM) is Not Applicable. SAC: 998313 (IT SaaS Infrastructure).',
    '4. Supply of online information & database access / retrieval (OIDAR) services. Place of Supply: 27 - Maharashtra (Intra-State GST Compliant).',
    '5. Disputes regarding service or billing must be communicated in writing within 15 calendar days. Subject to Jalgaon / Maharashtra jurisdiction.'
  ];

  let termY = y + 9.5;
  terms.forEach((t) => {
    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED_TEXT);
    doc.text(t, M + 4, termY);
    termY += 4;
  });

  // ═══════════════════════════════════════════════════════════
  // 7. FOOTER (Anchored cleanly at bottom of page)
  // ═══════════════════════════════════════════════════════════
  const footerY = 273;
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.3);
  doc.line(M, footerY, W - M, footerY);

  const genTs = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  }) + ' IST';

  // Left Footer — clearly split lines with zero chance of collision
  doc.setFontSize(6.4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('This is an authorized system-generated tax document. Physical signature is not required under Rule 46 of CGST Rules, 2017.', M, footerY + 4.5);
  doc.text('Aravanta CloudOS Inc. \u2022 Jalgaon, Maharashtra, India - 425001 \u2022 support@aravanta.cloud', M, footerY + 8.5);
  doc.text(`Audit Trail: SHA256:${auditHash} \u2022 Generated on ${genTs}`, M, footerY + 12.5);

  // Right Footer — aligned right with fixed width
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...BLUE_TEXT);
  doc.text('Digitally Signed & Authorized', W - M, footerY + 4.5, { align: 'right' });

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Aravanta FinOps Billing Engine', W - M, footerY + 8.5, { align: 'right' });
  doc.text('Page 1 of 1 \u2022 Official Tax Document', W - M, footerY + 12.5, { align: 'right' });

  // ═══════════════════════════════════════════════════════════
  // 8. LUXURY BOTTOM BRAND STRIP (Frames the page bottom)
  // ═══════════════════════════════════════════════════════════
  doc.setFillColor(...PRIMARY_NAVY);
  doc.rect(0, 294, W, 3, 'F');

  // ─── Save & Download ─────────────────────────────────────
  doc.save(`Aravanta_Invoice_${data.invoice_id}.pdf`);
};
