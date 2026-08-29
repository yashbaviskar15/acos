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

const formatINR = (amount: number): string => {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const generateInvoicePDF = (data: InvoiceData): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  // ─── HEADER BACKGROUND ───
  doc.setFillColor(15, 32, 56); // Dark navy
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ARAVANTA CLOUDOS', margin, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Enterprise Cloud Infrastructure Platform', margin, 30);

  // TAX INVOICE label (right-aligned)
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(201, 168, 76); // Gold accent
  doc.text('TAX INVOICE', pageWidth - margin, 25, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(180, 200, 230);
  doc.text('Original for Recipient', pageWidth - margin, 33, { align: 'right' });

  y = 60;

  // ─── INVOICE DETAILS BOX ───
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 40, 3, 3, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  // Left column
  doc.text('INVOICE NUMBER', margin + 5, y + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(data.invoice_id, margin + 5, y + 15);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('BILLING PERIOD', margin + 5, y + 24);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(data.period, margin + 5, y + 31);

  // Right column
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('INVOICE DATE', pageWidth - margin - 55, y + 8);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text(data.date, pageWidth - margin - 55, y + 15);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.text('GSTIN / SAC', pageWidth - margin - 55, y + 24);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.text('27AAAAA0000A1Z5 (SAC 998313)', pageWidth - margin - 55, y + 31);

  y += 48;

  // ─── CUSTOMER DETAILS ───
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 3, 3, 'F');

  doc.setTextColor(37, 99, 235);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', margin + 5, y + 8);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_name || 'Aravanta Cloud User', margin + 30, y + 8);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(data.customer_email || 'admin@aravanta.cloud', margin + 30, y + 14);

  y += 28;

  // ─── SERVICE LINE ITEMS TABLE ───
  const tableData = data.services.map((svc, idx) => [
    (idx + 1).toString(),
    svc.name,
    '1',
    formatINR(svc.amount),
    formatINR(svc.amount)
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Service Description', 'Qty', 'Unit Price (₹)', 'Amount (₹)']],
    body: tableData,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 5,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [15, 32, 56],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  y = doc.lastAutoTable.finalY + 8;

  // ─── TOTALS SECTION ───
  const totalsX = pageWidth - margin - 85;

  // Subtotal
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', totalsX, y);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(formatINR(data.subtotal), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // CGST
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('CGST (9%):', totalsX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(data.cgst), pageWidth - margin, y, { align: 'right' });
  y += 7;

  // SGST
  doc.setTextColor(100, 116, 139);
  doc.text('SGST (9%):', totalsX, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(data.sgst), pageWidth - margin, y, { align: 'right' });
  y += 4;

  // Divider
  doc.setDrawColor(201, 168, 76);
  doc.setLineWidth(1);
  doc.line(totalsX, y, pageWidth - margin, y);
  y += 8;

  // Grand Total
  doc.setFillColor(15, 32, 56);
  doc.roundedRect(totalsX - 5, y - 6, pageWidth - margin - totalsX + 5, 14, 2, 2, 'F');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(201, 168, 76);
  doc.text('GRAND TOTAL:', totalsX, y + 2);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text(formatINR(data.total), pageWidth - margin - 3, y + 3, { align: 'right' });

  y += 22;

  // ─── PAYMENT CONFIRMATION ───
  if (data.payment_id) {
    doc.setFillColor(236, 253, 245);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 24, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(' PAYMENT CONFIRMED', margin + 5, y + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Transaction ID: ${data.payment_id}`, margin + 5, y + 15);
    if (data.order_id) {
      doc.text(`Order ID: ${data.order_id}`, margin + 5, y + 20);
    }

    y += 30;
  }

  // ─── FOOTER ───
  y = doc.internal.pageSize.getHeight() - 35;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated invoice and does not require a physical signature.', margin, y);
  doc.text('Aravanta CloudOS Inc. • CIN: U72200MH2026PTC000001 • support@aravanta.cloud', margin, y + 5);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}`, margin, y + 10);

  // Digital Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(37, 99, 235);
  doc.text('Digitally Signed by Aravanta CloudOS Billing Engine', pageWidth - margin, y + 5, { align: 'right' });

  // Save & Download
  doc.save(`Aravanta_Invoice_${data.invoice_id}.pdf`);
};
