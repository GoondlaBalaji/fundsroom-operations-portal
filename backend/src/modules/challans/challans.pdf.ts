// src/modules/challans/challans.pdf.ts
import PDFDocument from 'pdfkit';

export interface ChallanPdfItem {
  id?: string;
  productId?: string;
  snapshotName: string;
  snapshotSku: string;
  snapshotUnitPrice: number | string | any;
  quantity: number;
  lineTotal: number | string | any;
}

export interface ChallanPdfData {
  id: string;
  challanNumber: string;
  status: string;
  createdAt: Date | string;
  confirmedAt?: Date | string | null;
  totalQuantity: number;
  totalAmount: number | string | any;
  notes?: string | null;
  createdBy?: {
    name: string;
    email?: string;
  } | null;
  customer: {
    name: string;
    mobile: string;
    email?: string | null;
    businessName: string;
    gstNumber?: string | null;
    customerType: string;
    address: string;
  };
  items: ChallanPdfItem[];
}

const formatCurrency = (val: number | string | any): string => {
  const num = Number(val) || 0;
  return `INR ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (date: Date | string | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

function drawTableHeader(doc: PDFKit.PDFDocument, y: number): number {
  // Header background
  doc.rect(40, y, 515, 20).fill('#1E293B');
  doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold');

  doc.text('#', 40, y + 6, { width: 25, align: 'center' });
  doc.text('PRODUCT / DESCRIPTION', 68, y + 6, { width: 197, align: 'left' });
  doc.text('SKU', 268, y + 6, { width: 87, align: 'left' });
  doc.text('QTY', 355, y + 6, { width: 45, align: 'right' });
  doc.text('UNIT PRICE', 400, y + 6, { width: 75, align: 'right' });
  doc.text('LINE TOTAL', 475, y + 6, { width: 75, align: 'right' });

  return y + 20;
}

export function generateChallanPdf(challan: ChallanPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      info: {
        Title: `Delivery Challan - ${challan.challanNumber}`,
        Author: 'Fundsroom Operations Portal',
        Subject: `Invoice & Delivery Challan ${challan.challanNumber}`,
      },
    });

    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Top brand accent stripe
    doc.rect(40, 30, 515, 4).fill('#2563EB');

    // Header: Company details on left, Document info on right
    let y = 44;

    // Company Header
    doc.fillColor('#0F172A').fontSize(18).font('Helvetica-Bold').text('FUNDSROOM', 40, y);
    doc.fillColor('#64748B').fontSize(8.5).font('Helvetica').text('Wholesale & Distribution Operations Management', 40, y + 20);
    doc.fontSize(7.5).text('Enterprise Operations Portal  •  Internal Logistics System', 40, y + 31);

    // Document Title & Metadata Box on Right
    doc.rect(340, y, 215, 62).fill('#F8FAFC');
    doc.rect(340, y, 215, 62).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

    doc.fillColor('#1E293B').fontSize(11).font('Helvetica-Bold').text('DELIVERY CHALLAN', 348, y + 8, { width: 200, align: 'left' });

    doc.fontSize(8).font('Helvetica');
    doc.fillColor('#64748B').text('Challan No:', 348, y + 23);
    doc.fillColor('#0F172A').font('Helvetica-Bold').text(challan.challanNumber, 415, y + 23);

    doc.fillColor('#64748B').font('Helvetica').text('Date:', 348, y + 35);
    doc.fillColor('#0F172A').text(formatDate(challan.createdAt), 415, y + 35);

    doc.fillColor('#64748B').text('Status:', 348, y + 47);
    const statusColor = challan.status === 'CONFIRMED' ? '#16A34A' : challan.status === 'CANCELLED' ? '#DC2626' : '#D97706';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(challan.status, 415, y + 47);

    y = 118;

    // Horizontal Divider
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#E2E8F0').lineWidth(1).stroke();

    y += 10;

    // Customer & Dispatch Details (2-Column Grid)
    // Left Box: Customer (Bill To / Ship To)
    const boxWidth = 250;
    const boxHeight = 100;
    doc.rect(40, y, boxWidth, boxHeight).fill('#F8FAFC');
    doc.rect(40, y, boxWidth, boxHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

    doc.fillColor('#2563EB').fontSize(8.5).font('Helvetica-Bold').text('CUSTOMER (BILL & SHIP TO)', 48, y + 8);

    doc.fillColor('#0F172A').fontSize(9.5).font('Helvetica-Bold').text(challan.customer.name, 48, y + 21, { width: 234, lineBreak: false, ellipsis: true });
    doc.fillColor('#475569').fontSize(8).font('Helvetica');
    doc.text(challan.customer.businessName, 48, y + 33, { width: 234, lineBreak: false, ellipsis: true });

    let custInfoY = y + 45;
    if (challan.customer.gstNumber) {
      doc.text(`GSTIN: ${challan.customer.gstNumber}`, 48, custInfoY);
      custInfoY += 11;
    }
    doc.text(`Mobile: ${challan.customer.mobile}  •  Type: ${challan.customer.customerType}`, 48, custInfoY);
    custInfoY += 11;
    doc.text(`Address: ${challan.customer.address}`, 48, custInfoY, { width: 234, height: 22, ellipsis: true });

    // Right Box: Dispatch & Audit Info
    const rightBoxX = 305;
    doc.rect(rightBoxX, y, boxWidth, boxHeight).fill('#F8FAFC');
    doc.rect(rightBoxX, y, boxWidth, boxHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

    doc.fillColor('#2563EB').fontSize(8.5).font('Helvetica-Bold').text('DISPATCH & AUDIT TRAIL', rightBoxX + 8, y + 8);

    doc.fillColor('#64748B').fontSize(8).font('Helvetica');
    doc.text('Prepared By:', rightBoxX + 8, y + 23);
    doc.fillColor('#0F172A').font('Helvetica-Bold').text(challan.createdBy?.name || 'Authorized Staff', rightBoxX + 75, y + 23);

    doc.fillColor('#64748B').font('Helvetica').text('Created On:', rightBoxX + 8, y + 36);
    doc.fillColor('#0F172A').text(formatDate(challan.createdAt), rightBoxX + 75, y + 36);

    doc.fillColor('#64748B').text('Confirmed On:', rightBoxX + 8, y + 49);
    doc.fillColor('#0F172A').text(challan.confirmedAt ? formatDate(challan.confirmedAt) : 'Pending Confirmation', rightBoxX + 75, y + 49);

    doc.fillColor('#64748B').text('Order Status:', rightBoxX + 8, y + 62);
    doc.fillColor(statusColor).font('Helvetica-Bold').text(challan.status, rightBoxX + 75, y + 62);

    doc.fillColor('#64748B').font('Helvetica').text('Delivery Type:', rightBoxX + 8, y + 75);
    doc.fillColor('#0F172A').text('Direct Warehouse Dispatch', rightBoxX + 75, y + 75);

    y += boxHeight + 14;

    // Items Table Header
    y = drawTableHeader(doc, y);

    // Items Rows (Snapshot Data Only)
    for (let i = 0; i < challan.items.length; i++) {
      const item = challan.items[i];
      const rowHeight = 22;

      // Page overflow check (leaves room for totals & footer)
      if (y + rowHeight > 730) {
        doc.addPage();
        y = 40;
        y = drawTableHeader(doc, y);
      }

      // Alternating row background
      if (i % 2 === 1) {
        doc.rect(40, y, 515, rowHeight).fill('#F8FAFC');
      }

      // Bottom row divider line
      doc.moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      // Row content
      doc.fillColor('#64748B').fontSize(8).font('Helvetica');
      doc.text(String(i + 1), 40, y + 6, { width: 25, align: 'center' });

      // Product Snapshot Name
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(item.snapshotName, 68, y + 6, {
        width: 197,
        lineBreak: false,
        ellipsis: true,
      });

      // Product Snapshot SKU
      doc.font('Helvetica').fillColor('#475569').text(item.snapshotSku, 268, y + 6, {
        width: 87,
        lineBreak: false,
        ellipsis: true,
      });

      // Quantity
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(String(item.quantity), 355, y + 6, {
        width: 45,
        align: 'right',
      });

      // Unit Price (Snapshot)
      doc.font('Helvetica').fillColor('#334155').text(formatCurrency(item.snapshotUnitPrice), 400, y + 6, {
        width: 75,
        align: 'right',
      });

      // Line Total (persisted / calculated from snapshot)
      doc.font('Helvetica-Bold').fillColor('#0F172A').text(formatCurrency(item.lineTotal), 475, y + 6, {
        width: 75,
        align: 'right',
      });

      y += rowHeight;
    }

    // Totals Block
    if (y + 110 > 730) {
      doc.addPage();
      y = 40;
    }

    const totalsY = y + 10;
    const totalsWidth = 230;
    const totalsX = 555 - totalsWidth;

    doc.rect(totalsX, totalsY, totalsWidth, 54).fill('#F1F5F9');
    doc.rect(totalsX, totalsY, totalsWidth, 54).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

    doc.fillColor('#475569').fontSize(8.5).font('Helvetica');
    doc.text('Total Quantity:', totalsX + 10, totalsY + 9, { width: 100, align: 'left' });
    doc.font('Helvetica-Bold').fillColor('#0F172A').text(String(challan.totalQuantity), totalsX + 110, totalsY + 9, {
      width: 110,
      align: 'right',
    });

    doc.moveTo(totalsX + 10, totalsY + 26).lineTo(totalsX + totalsWidth - 10, totalsY + 26).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

    doc.fillColor('#0F172A').fontSize(10).font('Helvetica-Bold');
    doc.text('Total Amount:', totalsX + 10, totalsY + 33, { width: 100, align: 'left' });
    doc.fillColor('#1E3A8A').text(formatCurrency(challan.totalAmount), totalsX + 110, totalsY + 33, {
      width: 110,
      align: 'right',
    });

    y = totalsY + 68;

    // Notes Section (if notes exist)
    if (challan.notes && challan.notes.trim()) {
      if (y + 40 > 730) {
        doc.addPage();
        y = 40;
      }
      doc.fillColor('#2563EB').fontSize(8).font('Helvetica-Bold').text('SPECIAL INSTRUCTIONS / NOTES', 40, y);
      doc.fillColor('#334155').fontSize(8).font('Helvetica').text(challan.notes.trim(), 40, y + 12, { width: 515 });
      y += 32;
    }

    // Signatures / Declarations section
    if (y + 70 > 730) {
      doc.addPage();
      y = 40;
    }

    const sigY = y + 25;
    // Receiver Sign-off
    doc.moveTo(40, sigY + 25).lineTo(190, sigY + 25).strokeColor('#94A3B8').lineWidth(0.5).stroke();
    doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text("Receiver's Signature & Stamp", 40, sigY + 30, {
      width: 150,
      align: 'center',
    });

    // Authorized Signatory
    doc.moveTo(405, sigY + 25).lineTo(555, sigY + 25).strokeColor('#94A3B8').lineWidth(0.5).stroke();
    doc.fillColor('#64748B').fontSize(7.5).font('Helvetica').text('For Fundsroom Operations Portal', 405, sigY + 30, {
      width: 150,
      align: 'center',
    });
    doc.fontSize(6.5).font('Helvetica-Oblique').text('(Authorized Signatory)', 405, sigY + 40, {
      width: 150,
      align: 'center',
    });

    // Multi-page page numbers and footer branding on every page
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      // Footer dividing line
      doc.moveTo(40, doc.page.height - 35).lineTo(555, doc.page.height - 35).strokeColor('#E2E8F0').lineWidth(0.5).stroke();

      doc.fontSize(7.5).fillColor('#64748B').font('Helvetica');
      doc.text(
        `Fundsroom Operations Portal  •  Official Delivery Challan: ${challan.challanNumber}`,
        40,
        doc.page.height - 26,
        { width: 320, align: 'left' }
      );
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        doc.page.width - 190,
        doc.page.height - 26,
        { width: 150, align: 'right' }
      );
    }

    doc.end();
  });
}
