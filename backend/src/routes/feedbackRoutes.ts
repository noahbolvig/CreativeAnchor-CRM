import express from 'express';
import {
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  voteFeedback,
  deleteFeedback,
} from '../controllers/feedbackController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Feedback routes
router.get('/', getAllFeedback);
router.get('/:id', getFeedbackById);
router.post('/', createFeedback);
router.post('/:id/vote', voteFeedback);
router.delete('/:id', deleteFeedback);

export default router;