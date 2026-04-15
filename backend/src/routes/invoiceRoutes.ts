import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  updateInvoiceStatus,
  deleteInvoice,
} from '../controllers/invoiceController';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Invoice routes
router.get('/', getAllInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;