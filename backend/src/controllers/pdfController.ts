import { Response } from 'express';
import { pdfService } from '../services/pdfService';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate and download invoice PDF
 */
export const downloadInvoicePDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.invoiceId as string;
    const userId = req.user?.userId;

    if (!invoiceId || typeof invoiceId !== 'string') {
      res.status(400).json({ error: 'Invoice ID is required' });
      return;
    }

    // Verify invoice exists and belongs to user (through client)
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        client: {
          userId: userId,
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Generate PDF
    const pdfBuffer = await pdfService.generateInvoicePDF({
      invoiceId: invoiceId,
      userId: userId!,
    });

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate PDF' });
  }
};