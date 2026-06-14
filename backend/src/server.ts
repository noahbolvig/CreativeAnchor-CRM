import * as emailController from './controllers/emailController';
console.log('📧 Email controller exports:', Object.keys(emailController));
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Route imports
import authRoutes from './routes/authRoutes';
import clientRoutes from './routes/clientRoutes';
import projectRoutes from './routes/projectRoutes';
import fileRoutes from './routes/fileRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import emailRoutes from './routes/emailRoutes';
import pdfRoutes from './routes/pdfRoutes';

// Automation scheduler
import { startAutomationScheduler, runAutomationsNow } from './automations/scheduler';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL || '',
    'https://animated-lokum-22de2d.netlify.app',
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// HEALTH & UTILITY ENDPOINTS
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'CreativeAnchor CRM API is running!',
    timestamp: new Date().toISOString(),
    port: PORT,
    features: {
      automations: true,
      email: true,
    }
  });
});

app.post('/api/automations/run', async (req, res) => {
  try {
    await runAutomationsNow();
    res.json({ 
      success: true,
      message: 'Automations executed successfully' 
    });
  } catch (error) {
    console.error('Automation error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to run automations' 
    });
  }
});

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/pdf', pdfRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ====================================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`📧 Email service: Ready`);
  console.log('🚀 ====================================');
  console.log('');
  
  // Start automation scheduler
  startAutomationScheduler();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});