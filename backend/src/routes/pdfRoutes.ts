import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { downloadInvoicePDF } from '../controllers/pdfController';

const router = Router();

router.use(authenticateToken);

router.get('/invoice/:invoiceId', downloadInvoicePDF);

export default router;