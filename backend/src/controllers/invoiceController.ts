import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all invoices
export const getAllInvoices = async (req: Request, res: Response): Promise<void> => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        project: {
          include: {
            client: true,
          }
        },
        items: {
          orderBy: { order: 'asc' }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(invoices);
  } catch (error: any) {
    console.error('Get all invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user?.userId;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            vatNumber: true,
            address: true,
            city: true,
            postalCode: true,
            country: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        },
        items: {
          orderBy: { order: 'asc' }
        },
      },
    });

    if (!invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // Fetch user business info
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

    // Combine invoice with business info
    const invoiceWithBusiness = {
      ...invoice,
      business: user,
    };

    res.json(invoiceWithBusiness);
  } catch (error: any) {
    console.error('Get invoice by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// Create invoice
export const createInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId, projectId, invoiceNumber, issueDate, dueDate, status, reverseCharge, notes, items } = req.body;

    console.log('=== CREATE INVOICE DEBUG ===');
    console.log('Received data:', JSON.stringify(req.body, null, 2));

    // Validation
    if (!clientId) {
      res.status(400).json({ error: 'Client ID is required' });
      return;
    }

    if (!issueDate) {
      res.status(400).json({ error: 'Issue date is required' });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one item is required' });
      return;
    }

    // Validate and parse items
    const validatedItems = items.map((item: any, index: number) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const vatRate = Number(item.vatRate);

      if (!item.description || isNaN(quantity) || isNaN(unitPrice) || isNaN(vatRate)) {
        throw new Error(`Invalid item at index ${index}`);
      }

      if (quantity <= 0 || unitPrice < 0) {
        throw new Error(`Invalid quantity or price at item ${index}`);
      }

      const amount = quantity * unitPrice;

      return {
        description: item.description,
        quantity,
        unitPrice,
        amount,
        vatRate,
        order: item.order !== undefined ? item.order : index,
      };
    });

    // Calculate totals
    const subtotal = validatedItems.reduce((sum, item) => sum + item.amount, 0);
    
    let vatAmount = 0;
    if (!reverseCharge) {
      vatAmount = validatedItems.reduce((sum, item) => {
        return sum + (item.amount * (item.vatRate / 100));
      }, 0);
    }

    const total = subtotal + vatAmount;

    console.log('Calculated amounts:', {
      subtotal,
      vatAmount,
      total,
      reverseCharge,
    });

    // Generate invoice number if not provided
    let finalInvoiceNumber = invoiceNumber;
    if (!finalInvoiceNumber) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      const count = await prisma.invoice.count({
        where: {
          invoiceNumber: {
            startsWith: `INV-${year}${month}-`
          }
        }
      });

      finalInvoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }

    console.log('Final invoice number:', finalInvoiceNumber);

    // Create invoice with items
    const invoice = await prisma.invoice.create({
      data: {
        clientId,
        projectId: projectId || null,
        invoiceNumber: finalInvoiceNumber,
        amount: total,
        subtotal,
        vatAmount,
        reverseCharge: reverseCharge || false,
        status: status || 'DRAFT',
        issueDate: new Date(issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        items: {
          create: validatedItems,
        },
      },
      include: {
        client: true,
        project: {
          include: {
            client: true,
          }
        },
        items: {
          orderBy: { order: 'asc' }
        },
      },
    });

    console.log('✅ Invoice created successfully:', invoice.id);
    res.status(201).json(invoice);
  } catch (error: any) {
    console.error('❌ Create invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to create invoice' });
  }
};

// Update invoice
export const updateInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { clientId, projectId, invoiceNumber, issueDate, dueDate, status, reverseCharge, notes, items } = req.body;

    console.log('=== UPDATE INVOICE DEBUG ===');
    console.log('Invoice ID:', id);
    console.log('Received data:', JSON.stringify(req.body, null, 2));

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }

    // If items are provided, validate and calculate
    let updateData: any = {
      clientId,
      projectId: projectId || null,
      invoiceNumber,
      status,
      reverseCharge: reverseCharge || false,
      notes: notes || null,
    };

    if (issueDate) {
      updateData.issueDate = new Date(issueDate);
    }

    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    }

    if (items && Array.isArray(items) && items.length > 0) {
      // Validate and parse items
      const validatedItems = items.map((item: any, index: number) => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        const vatRate = Number(item.vatRate);

        if (!item.description || isNaN(quantity) || isNaN(unitPrice) || isNaN(vatRate)) {
          throw new Error(`Invalid item at index ${index}`);
        }

        if (quantity <= 0 || unitPrice < 0) {
          throw new Error(`Invalid quantity or price at item ${index}`);
        }

        const amount = quantity * unitPrice;

        return {
          description: item.description,
          quantity,
          unitPrice,
          amount,
          vatRate,
          order: item.order !== undefined ? item.order : index,
        };
      });

      // Calculate totals
      const subtotal = validatedItems.reduce((sum, item) => sum + item.amount, 0);
      
      let vatAmount = 0;
      if (!reverseCharge) {
        vatAmount = validatedItems.reduce((sum, item) => {
          return sum + (item.amount * (item.vatRate / 100));
        }, 0);
      }

      const total = subtotal + vatAmount;

      updateData.subtotal = subtotal;
      updateData.vatAmount = vatAmount;
      updateData.amount = total;

      // Delete old items and create new ones
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      updateData.items = {
        create: validatedItems,
      };
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        project: {
          include: {
            client: true,
          }
        },
        items: {
          orderBy: { order: 'asc' }
        },
      },
    });

    console.log('✅ Invoice updated successfully:', invoice.id);
    res.json(invoice);
  } catch (error: any) {
    console.error('❌ Update invoice error:', error);
    res.status(500).json({ error: error.message || 'Failed to update invoice' });
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const validStatuses = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const updateData: any = { status };

    // Set paidDate when status changes to PAID
    if (status === 'PAID') {
      updateData.paidDate = new Date();
    } 
    // Clear paidDate when status changes away from PAID
    else {
      updateData.paidDate = null;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
            vatNumber: true,
          }
        },
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        items: {
          orderBy: { order: 'asc' }
        },
      },
    });

    res.json(invoice);
  } catch (error: any) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ error: 'Failed to update invoice status' });
  }
};

// Delete invoice
export const deleteInvoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    // Delete items first (cascade should handle this, but being explicit)
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: id }
    });

    // Delete invoice
    await prisma.invoice.delete({
      where: { id }
    });

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};