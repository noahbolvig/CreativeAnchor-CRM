import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface GenerateInvoicePDFParams {
  invoiceId: string;
  userId: string;
}

class PDFService {
  /**
   * Generate PDF from invoice HTML
   */
  async generateInvoicePDF(params: GenerateInvoicePDFParams): Promise<Buffer> {
    const { invoiceId, userId } = params;

    // Get invoice with all details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        project: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get user business info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true,
        vatNumber: true,
        address: true,
        city: true,
        postalCode: true,
        country: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    // Generate HTML
    const html = this.generateInvoiceHTML(invoice, user);

    // Convert to PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate invoice HTML for PDF
   */
  private generateInvoiceHTML(invoice: any, user: any): string {
    const subtotal = invoice.subtotal || 0;
    const vatAmount = invoice.vatAmount || 0;
    const total = invoice.amount || 0;
    const isReverseCharge = invoice.reverseCharge || false;
    const isPaid = invoice.status === 'PAID';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: A4;
              margin: 20mm 15mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              color: #111827;
              line-height: 1.5;
              background: white;
              font-size: 14px;
            }
            
            .container {
              max-width: 100%;
            }
            
            /* Header Section */
            .invoice-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
              page-break-after: avoid;
            }
            
            .invoice-title h1 {
              font-size: 36px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 8px;
            }
            
            .invoice-number {
              font-size: 20px;
              font-weight: 600;
              color: #111827;
            }
            
            .business-info {
              text-align: right;
              max-width: 50%;
            }
            
            .business-name {
              font-size: 20px;
              font-weight: bold;
              color: #111827;
              margin-bottom: 8px;
            }
            
            .business-details {
              font-size: 14px;
              color: #111827;
              line-height: 1.8;
            }
            
            .vat-info {
              font-weight: 600;
              color: #111827;
              margin-top: 8px;
            }
            
            /* Bill To & Details Section */
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 32px;
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            
            .section-label {
              font-size: 11px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
            }
            
            .client-name {
              font-size: 16px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 4px;
            }
            
            .client-details {
              font-size: 14px;
              color: #111827;
              line-height: 1.8;
            }
            
            /* Invoice Details Box */
            .details-box {
              padding: 24px;
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
            }
            
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 14px;
            }
            
            .detail-row:not(:last-child) {
              border-bottom: 1px solid #e5e7eb;
            }
            
            .detail-label {
              font-weight: 500;
              color: #374151;
            }
            
            .detail-value {
              font-weight: 600;
              color: #111827;
              text-align: right;
            }
            
            .paid-row {
              padding-top: 12px;
              margin-top: 8px;
              border-top: 2px solid #6ee7b7 !important;
            }
            
            .paid-row .detail-label,
            .paid-row .detail-value {
              color: #065f46;
            }
            
            /* Line Items Table */
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 40px 0;
              page-break-inside: avoid;
            }
            
            .items-table thead {
              border-bottom: 2px solid #111827;
            }
            
            .items-table th {
              padding: 16px 0;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #111827;
              text-align: left;
            }
            
            .items-table th:nth-child(2),
            .items-table th:nth-child(3),
            .items-table th:nth-child(4),
            .items-table th:nth-child(5) {
              text-align: right;
            }
            
            .items-table tbody tr {
              border-bottom: 1px solid #e5e7eb;
            }
            
            .items-table td {
              padding: 16px 0;
              color: #111827;
              font-size: 14px;
            }
            
            .items-table td:nth-child(2),
            .items-table td:nth-child(3),
            .items-table td:nth-child(4),
            .items-table td:nth-child(5) {
              text-align: right;
            }
            
            .items-table td:nth-child(5) {
              font-weight: 600;
            }
            
            /* Totals Section */
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin: 40px 0;
              page-break-inside: avoid;
            }
            
            .totals-box {
              width: 400px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              font-size: 16px;
            }
            
            .total-label {
              font-weight: 500;
              color: #111827;
            }
            
            .total-value {
              font-weight: 600;
              color: #111827;
            }
            
            .total-final {
              padding-top: 16px;
              margin-top: 12px;
              border-top: 2px solid #111827;
              font-size: 24px;
              font-weight: bold;
            }
            
            .reverse-charge-note {
              font-size: 12px;
              color: #6b7280;
              font-style: italic;
              margin-top: 8px;
              line-height: 1.6;
            }
            
            /* Notes Section */
            .notes-section {
              margin: 40px 0;
              padding: 24px;
              background: #f9fafb;
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              page-break-inside: avoid;
            }
            
            .notes-title {
              font-size: 11px;
              font-weight: 600;
              color: #111827;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              margin-bottom: 12px;
            }
            
            .notes-text {
              font-size: 14px;
              color: #111827;
              line-height: 1.8;
              white-space: pre-wrap;
            }
            
            /* Paid Stamp */
            .paid-stamp-section {
              text-align: center;
              margin: 40px 0;
              page-break-inside: avoid;
            }
            
            .paid-stamp {
              display: inline-block;
              padding: 16px 32px;
              background: #d1fae5;
              border: 2px solid #6ee7b7;
              color: #065f46;
              font-size: 14px;
              font-weight: bold;
              border-radius: 12px;
            }
            
            .paid-stamp-date {
              font-size: 14px;
              color: #065f46;
              font-weight: 600;
              margin-top: 8px;
            }
            
            /* Footer */
            .invoice-footer {
              margin-top: 60px;
              padding-top: 32px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              page-break-inside: avoid;
            }
            
            .footer-title {
              font-size: 14px;
              font-weight: 500;
              color: #374151;
              margin-bottom: 8px;
            }
            
            .footer-text {
              font-size: 12px;
              color: #6b7280;
            }
            
            /* Print optimizations */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="invoice-header">
              <div class="invoice-title">
                <h1>INVOICE</h1>
                <div class="invoice-number">${invoice.invoiceNumber}</div>
              </div>
              
              <div class="business-info">
                ${user?.businessName ? `
                  <div class="business-name">${user.businessName}</div>
                  <div class="business-details">
                    ${user.address ? `${user.address}<br>` : ''}
                    ${user.postalCode || user.city ? `${user.postalCode || ''} ${user.city || ''}<br>` : ''}
                    ${user.country ? `${user.country}<br>` : ''}
                  </div>
                  ${user.vatNumber ? `<div class="vat-info">VAT: ${user.vatNumber}</div>` : ''}
                  ${user.email ? `<div style="color: #6b7280; margin-top: 4px; font-size: 14px;">${user.email}</div>` : ''}
                ` : ''}
              </div>
            </div>

            <!-- Bill To & Invoice Details -->
            <div class="info-section">
              <!-- Bill To -->
              <div>
                <div class="section-label">Bill To</div>
                ${invoice.client ? `
                  <div class="client-name">${invoice.client.name}</div>
                  <div class="client-details">
                    ${invoice.client.company ? `${invoice.client.company}<br>` : ''}
                    ${invoice.client.address ? `${invoice.client.address}<br>` : ''}
                    ${invoice.client.postalCode || invoice.client.city ? `${invoice.client.postalCode || ''} ${invoice.client.city || ''}<br>` : ''}
                    ${invoice.client.country ? `${invoice.client.country}<br>` : ''}
                    ${invoice.client.email ? `<span style="color: #6b7280; margin-top: 8px; display: inline-block;">${invoice.client.email}</span><br>` : ''}
                    ${invoice.client.vatNumber ? `<span style="font-weight: 600; margin-top: 8px; display: inline-block;">VAT: ${invoice.client.vatNumber}</span>` : ''}
                  </div>
                ` : '<div class="client-details" style="color: #9ca3af;">No client information</div>'}
              </div>

              <!-- Invoice Details -->
              <div class="details-box">
                ${invoice.project ? `
                  <div class="detail-row">
                    <span class="detail-label">Project:</span>
                    <span class="detail-value">${invoice.project.title}</span>
                  </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Issue Date:</span>
                  <span class="detail-value">${new Date(invoice.issueDate).toLocaleDateString('en-GB')}</span>
                </div>
                ${invoice.dueDate ? `
                  <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value">${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
                  </div>
                ` : ''}
                ${isPaid && invoice.paidDate ? `
                  <div class="detail-row paid-row">
                    <span class="detail-label">Paid Date:</span>
                    <span class="detail-value">${new Date(invoice.paidDate).toLocaleDateString('en-GB')}</span>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Line Items -->
            ${invoice.items && invoice.items.length > 0 ? `
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>VAT %</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map((item: any) => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>€${item.unitPrice.toFixed(2)}</td>
                      <td>${item.vatRate}%</td>
                      <td>€${(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <div style="padding: 24px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; margin: 40px 0;">
                <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">Service Provided</div>
                ${invoice.project?.description ? `<div style="color: #374151; font-size: 14px; line-height: 1.8;">${invoice.project.description}</div>` : ''}
              </div>
            `}

            <!-- Totals -->
            <div class="totals-section">
              <div class="totals-box">
                <div class="total-row">
                  <span class="total-label">Subtotal:</span>
                  <span class="total-value">€${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span class="total-label">VAT ${isReverseCharge ? '(0% - Reverse Charge)' : `(${invoice.vatRate || 21}%)`}:</span>
                  <span class="total-value">€${isReverseCharge ? '0.00' : vatAmount.toFixed(2)}</span>
                </div>
                <div class="total-row total-final">
                  <span class="total-label">Total:</span>
                  <span class="total-value">€${total.toFixed(2)}</span>
                </div>
                ${isReverseCharge ? `
                  <div class="reverse-charge-note">
                    * Reverse charge applies - VAT to be accounted for by recipient
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Paid Stamp -->
            ${isPaid && invoice.paidDate ? `
              <div class="paid-stamp-section">
                <div class="paid-stamp">✓ PAID IN FULL</div>
                <div class="paid-stamp-date">
                  Paid on ${new Date(invoice.paidDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
            ` : ''}

            <!-- Notes -->
            ${invoice.notes ? `
              <div class="notes-section">
                <div class="notes-title">Notes / Payment Terms</div>
                <div class="notes-text">${invoice.notes}</div>
              </div>
            ` : ''}

            <!-- Footer -->
            <div class="invoice-footer">
              <div class="footer-title">Thank you for your business!</div>
              ${user?.email ? `
                <div class="footer-text">Questions? Contact us at ${user.email}</div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const pdfService = new PDFService();