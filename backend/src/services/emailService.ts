import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvoiceEmailParams {
  to: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  invoiceUrl: string;
  businessName: string;
  pdfBuffer?: Buffer;
}

interface SendCustomEmailParams {
  to: string;
  subject: string;
  message: string;
  fromName: string;
}

class EmailService {
  /**
   * Send invoice email to client with PDF attachment
   */
  async sendInvoiceEmail(params: SendInvoiceEmailParams & { pdfBuffer?: Buffer }) {
    try {
      const { to, clientName, invoiceNumber, amount, dueDate, invoiceUrl, businessName, pdfBuffer } = params;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .invoice-details {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
              }
              .detail-row:last-child {
                border-bottom: none;
                font-weight: bold;
                font-size: 1.2em;
              }
              .button {
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
              .attachment-notice {
                background: #eff6ff;
                border: 2px solid #3b82f6;
                padding: 16px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: center;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 0.875rem;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">Invoice from ${businessName}</h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>Thank you for your business! Please find your invoice attached as a PDF.</p>
              
              <div class="invoice-details">
                <div class="detail-row">
                  <span>Invoice Number:</span>
                  <strong>${invoiceNumber}</strong>
                </div>
                <div class="detail-row">
                  <span>Amount Due:</span>
                  <strong>€${amount.toFixed(2)}</strong>
                </div>
                <div class="detail-row">
                  <span>Due Date:</span>
                  <strong>${new Date(dueDate).toLocaleDateString('en-GB', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</strong>
                </div>
              </div>

              ${pdfBuffer ? `
                <div class="attachment-notice">
                  <strong>📎 PDF Invoice Attached</strong><br>
                  <span style="font-size: 0.9em; color: #1e40af;">The invoice is attached to this email as a PDF file</span>
                </div>
              ` : ''}

              <center>
                <a href="${invoiceUrl}" class="button">View Invoice Online</a>
              </center>

              <p style="margin-top: 30px;">
                If you have any questions about this invoice, please don't hesitate to contact us.
              </p>

              <div class="footer">
                <p>This email was sent by ${businessName}</p>
                <p style="font-size: 0.75rem; color: #9ca3af;">
                  You received this email because you are a client of ${businessName}
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      // Prepare email options
      const emailOptions: any = {
        from: `${businessName} <onboarding@resend.dev>`,
        to: [to],
        subject: `Invoice ${invoiceNumber} from ${businessName}`,
        html,
      };

      // Add PDF attachment if provided
      if (pdfBuffer) {
        emailOptions.attachments = [
          {
            filename: `${invoiceNumber}.pdf`,
            content: pdfBuffer,
          },
        ];
      }

      const { data, error } = await resend.emails.send(emailOptions);

      if (error) {
        console.error('❌ Email send error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Invoice email sent with PDF attachment:', data?.id);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to send invoice email:', error);
      throw error;
    }
  }

  /**
   * Send custom email to client
   */
  async sendCustomEmail(params: SendCustomEmailParams) {
    try {
      const { to, subject, message, fromName } = params;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
              }
              .footer {
                text-align: center;
                color: #6b7280;
                font-size: 0.875rem;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
              }
            </style>
          </head>
          <body>
            <div class="content">
              ${message.split('\n').map(line => `<p>${line}</p>`).join('')}
              
              <div class="footer">
                <p>Best regards,<br>${fromName}</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const { data, error } = await resend.emails.send({
        from: `${fromName} <onboarding@resend.dev>`,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Email send error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Custom email sent:', data?.id);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to send custom email:', error);
      throw error;
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(params: SendInvoiceEmailParams) {
    try {
      const { to, clientName, invoiceNumber, amount, dueDate, invoiceUrl, businessName } = params;

      const isOverdue = new Date(dueDate) < new Date();
      const daysUntil = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background: ${isOverdue ? '#ef4444' : '#f59e0b'};
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
              }
              .content {
                background: white;
                padding: 30px;
                border: 1px solid #e5e7eb;
                border-top: none;
              }
              .button {
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 style="margin: 0;">
                ${isOverdue ? '⚠️ Payment Overdue' : '🔔 Payment Reminder'}
              </h1>
            </div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p>
                ${isOverdue 
                  ? `Invoice ${invoiceNumber} is now overdue. We would appreciate your prompt payment.`
                  : `This is a friendly reminder that invoice ${invoiceNumber} is due ${daysUntil === 0 ? 'today' : daysUntil === 1 ? 'tomorrow' : `in ${daysUntil} days`}.`
                }
              </p>
              
              <p><strong>Amount Due: €${amount.toFixed(2)}</strong></p>
              <p><strong>Due Date: ${new Date(dueDate).toLocaleDateString('en-GB')}</strong></p>

              <center>
                <a href="${invoiceUrl}" class="button">View Invoice</a>
              </center>

              <p style="margin-top: 30px;">
                If you've already paid, please disregard this reminder. If you have any questions, feel free to reach out.
              </p>
            </div>
          </body>
        </html>
      `;

      const { data, error } = await resend.emails.send({
        from: `${businessName} <onboarding@resend.dev>`,
        to: [to],
        subject: `${isOverdue ? 'Payment Overdue' : 'Payment Reminder'}: Invoice ${invoiceNumber}`,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Payment reminder sent:', data?.id);
      return data;
    } catch (error: any) {
      console.error('❌ Failed to send payment reminder:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();