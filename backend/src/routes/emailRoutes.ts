import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  sendInvoiceEmail,
  sendPaymentReminder,
  sendCustomEmail,
} from '../controllers/emailController';

const router = Router();

router.use(authenticateToken);

router.post('/send-invoice', sendInvoiceEmail);
router.post('/send-reminder', sendPaymentReminder);
router.post('/send-custom', sendCustomEmail);

export default router;