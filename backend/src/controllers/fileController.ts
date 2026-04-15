import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import path from 'path';
import fs from 'fs';

// Get all files for a project
export const getProjectFiles = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { projectId } = req.params as { projectId: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const files = await prisma.file.findMany({
      where: { projectId },
      include: {
        revisions: {
          orderBy: { versionNumber: 'desc' },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload new file
export const uploadFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { projectId } = req.params as { projectId: string };
    const uploadedFile = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Create file record
    const file = await prisma.file.create({
      data: {
        projectId,
        fileName: uploadedFile.filename,
        originalName: uploadedFile.originalname,
        fileUrl: `/uploads/${uploadedFile.filename}`,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.mimetype,
        category: req.body.category || 'general',
      },
    });

    // Create first revision
    await prisma.revision.create({
      data: {
        projectId,
        fileId: file.id,
        versionNumber: 1,
        comment: req.body.comment || 'Initial upload',
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'File uploaded successfully',
      file,
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload new revision of existing file
export const uploadRevision = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fileId } = req.params as { fileId: string };
    const uploadedFile = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Verify file belongs to user's project
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: { userId },
      },
      include: {
        revisions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.projectId) {
      return res.status(400).json({ error: 'File has no associated project' });
    }

    // Get next version number
    const latestVersion = file.revisions[0]?.versionNumber || 0;
    const newVersion = latestVersion + 1;

    // Update file record with new file
    await prisma.file.update({
      where: { id: fileId },
      data: {
        fileName: uploadedFile.filename,
        fileUrl: `/uploads/${uploadedFile.filename}`,
        fileSize: uploadedFile.size,
      },
    });

    // Create new revision
    const revision = await prisma.revision.create({
      data: {
        projectId: file.projectId,
        fileId: file.id,
        versionNumber: newVersion,
        comment: req.body.comment || `Revision ${newVersion}`,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      message: 'Revision uploaded successfully',
      revision,
    });
  } catch (error) {
    console.error('Upload revision error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update revision status (approve/reject)
export const updateRevisionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { revisionId } = req.params as { revisionId: string };
    const { status, clientFeedback } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify revision belongs to user's project
    const revision = await prisma.revision.findFirst({
      where: {
        id: revisionId,
        project: { userId },
      },
    });

    if (!revision) {
      return res.status(404).json({ error: 'Revision not found' });
    }

    // Update revision
    const updatedRevision = await prisma.revision.update({
      where: { id: revisionId },
      data: {
        status,
        clientFeedback,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
      },
    });

    res.json({
      message: 'Revision status updated',
      revision: updatedRevision,
    });
  } catch (error) {
    console.error('Update revision status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete file
export const deleteFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fileId } = req.params as { fileId: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify file belongs to user's project
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: { userId },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete physical file
    const filePath = path.join(__dirname, '../../uploads', file.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database (cascades to revisions)
    await prisma.file.delete({
      where: { id: fileId },
    });

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Download file
export const downloadFile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { fileId } = req.params as { fileId: string };

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify file belongs to user's project
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        project: { userId },
      },
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', file.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, file.originalName);
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
