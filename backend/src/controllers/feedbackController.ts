import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all feedback
export const getAllFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { votes: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.json({ feedbacks });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single feedback
export const getFeedbackById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as { id: string };

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    res.json(feedback);
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create feedback
export const createFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { category, title, description, priority } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        category,
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'SUBMITTED',
        votes: 0,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Vote on feedback (upvote)
export const voteFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        votes: {
          increment: 1,
        },
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Vote recorded',
      feedback,
    });
  } catch (error) {
    console.error('Vote feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete feedback (own feedback only)
export const deleteFeedback = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify feedback belongs to user
    const feedback = await prisma.feedback.findFirst({
      where: { id, userId },
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found or unauthorized' });
    }

    await prisma.feedback.delete({
      where: { id },
    });

    res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};