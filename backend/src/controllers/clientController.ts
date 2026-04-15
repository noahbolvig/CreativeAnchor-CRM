import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

// Get all clients for the logged-in user
export const getClients = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const clients = await prisma.client.findMany({
      where: { userId },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({ clients });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single client by ID
export const getClientById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await prisma.client.findFirst({
      where: {
        id,
        userId, // Ensure user owns this client
      },
      include: {
        projects: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        files: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new client
export const createClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, email, phone, company, website, notes, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Client name is required' });
    }

    const client = await prisma.client.create({
      data: {
        userId,
        name,
        email,
        phone,
        company,
        website,
        notes,
        tags: tags || [],
      },
    });

    res.status(201).json({
      message: 'Client created successfully',
      client,
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update client
export const updateClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };
    const { name, email, phone, company, website, notes, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        email,
        phone,
        company,
        website,
        notes,
        tags,
      },
    });

    res.json({
      message: 'Client updated successfully',
      client,
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete client
export const deleteClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params as { id: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if client exists and belongs to user
    const existingClient = await prisma.client.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await prisma.client.delete({
      where: { id },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
