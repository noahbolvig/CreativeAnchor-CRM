import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all projects for the logged-in user
export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
      where: { userId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        _count: {
          select: {
            files: true,
            revisions: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { position: 'asc' },
      ],
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single project by ID
export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        client: true,
        files: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        revisions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        invoices: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new project
export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const {
      clientId,
      title,
      description,
      status,
      priority,
      budget,
      quotedAmount,
      deadline,
      startDate,
      creativeBrief,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!clientId || !title) {
      return res.status(400).json({ error: 'Client and title are required' });
    }

    // Verify client belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        userId,
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get max position for the status
    const maxPosition = await prisma.project.findFirst({
      where: {
        userId,
        status: status || 'IDEA',
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    const project = await prisma.project.create({
      data: {
        userId,
        clientId,
        title,
        description,
        status: status || 'IDEA',
        priority: priority || 'MEDIUM',
        budget: budget ? parseFloat(budget) : null,
        quotedAmount: quotedAmount ? parseFloat(quotedAmount) : null,
        deadline: deadline ? new Date(deadline) : null,
        startDate: startDate ? new Date(startDate) : null,
        creativeBrief,
        position: (maxPosition?.position || 0) + 1,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project
export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };
    const {
      clientId,
      title,
      description,
      status,
      priority,
      budget,
      quotedAmount,
      finalAmount,
      deadline,
      startDate,
      completedDate,
      creativeBrief,
      color,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        clientId,
        title,
        description,
        status,
        priority,
        budget: budget ? parseFloat(budget) : null,
        quotedAmount: quotedAmount ? parseFloat(quotedAmount) : null,
        finalAmount: finalAmount ? parseFloat(finalAmount) : null,
        deadline: deadline ? new Date(deadline) : null,
        startDate: startDate ? new Date(startDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
        creativeBrief,
        color,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
      },
    });

    res.json({
      message: 'Project updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update project status (for drag and drop)
export const updateProjectStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };
    const { status, position } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = await prisma.project.update({
  where: { id },
  data: {
    status, // ✅ CORRECT - use the status from req.body
    position,
  },
});

    res.json({
      message: 'Project status updated successfully',
      project,
    });
  } catch (error) {
    console.error('Update project status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete project
export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
