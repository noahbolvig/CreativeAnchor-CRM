import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';
import { pdfService } from '../services/pdfService';

const prisma = new PrismaClient();

/**
 * Send invoice email with PDF attachment
 */
export const sendInvoiceEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.body;
    const userId = req.user?.userId;

    if (!invoiceId) {
      res.status(400).json({ error: 'Invoice ID is required' });
      return;
    }

    // Get invoice with all details
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    if (!invoice.client?.email) {
      res.status(400).json({ error: 'Client has no email address' });
      return;
    }

    // Get user business info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true,
        email: true,
      },
    });

    if (!user?.businessName) {
      res.status(400).json({ error: 'Please set your business name in settings first' });
      return;
    }

    // Generate PDF
    console.log('📄 Generating PDF for invoice:', invoice.invoiceNumber);
    const pdfBuffer = await pdfService.generateInvoicePDF({
      invoiceId: invoice.id,
      userId: userId!,
    });
    console.log('✅ PDF generated, size:', pdfBuffer.length, 'bytes');

    // Send email with PDF attachment
    const invoiceUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}`;
    
    await emailService.sendInvoiceEmail({
      to: invoice.client.email,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      dueDate: invoice.dueDate?.toISOString() || invoice.issueDate.toISOString(),
      invoiceUrl,
      businessName: user.businessName,
      pdfBuffer, // Pass the PDF buffer
    });

    // Update invoice status to SENT if it was DRAFT
    if (invoice.status === 'DRAFT') {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'SENT' },
      });
    }

    res.json({ 
      success: true, 
      message: `Invoice sent to ${invoice.client.email} with PDF attachment` 
    });
  } catch (error: any) {
    console.error('Send invoice email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
};

/**
 * Send payment reminder
 */
export const sendPaymentReminder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { invoiceId } = req.body;
    const userId = req.user?.userId;

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true },
    });

    if (!invoice || !invoice.client?.email) {
      res.status(400).json({ error: 'Invalid invoice or client email' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true },
    });

    const invoiceUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invoices/${invoice.id}`;

    await emailService.sendPaymentReminder({
      to: invoice.client.email,
      clientName: invoice.client.name,
      invoiceNumber: invoice.invoiceNumber,
      amount: invoice.amount,
      dueDate: invoice.dueDate?.toISOString() || invoice.issueDate.toISOString(),
      invoiceUrl,
      businessName: user?.businessName || 'Your Business',
    });

    res.json({ success: true, message: 'Reminder sent' });
  } catch (error: any) {
    console.error('Send reminder error:', error);
    res.status(500).json({ error: error.message || 'Failed to send reminder' });
  }
};

/**
 * Send custom email to client
 */
export const sendCustomEmail = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clientId, subject, message } = req.body;
    const userId = req.user?.userId;

    if (!clientId || !subject || !message) {
      res.status(400).json({ error: 'Client, subject, and message are required' });
      return;
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client?.email) {
      res.status(400).json({ error: 'Client has no email address' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        businessName: true,
      },
    });

    const fromName = user?.businessName || `${user?.firstName} ${user?.lastName}` || 'Your Business';

    await emailService.sendCustomEmail({
      to: client.email,
      subject,
      message,
      fromName,
    });

    res.json({ success: true, message: `Email sent to ${client.email}` });
  } catch (error: any) {
    console.error('Send custom email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
};