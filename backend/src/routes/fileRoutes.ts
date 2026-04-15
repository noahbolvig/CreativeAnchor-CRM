import express from 'express';
import {
  getProjectFiles,
  uploadFile,
  uploadRevision,
  updateRevisionStatus,
  deleteFile,
  downloadFile,
} from '../controllers/fileController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// File routes
router.get('/project/:projectId', getProjectFiles);
router.post('/project/:projectId/upload', upload.single('file'), uploadFile);
router.post('/file/:fileId/revision', upload.single('file'), uploadRevision);
router.patch('/revision/:revisionId/status', updateRevisionStatus);
router.delete('/file/:fileId', deleteFile);
router.get('/file/:fileId/download', downloadFile);

export default router;
