import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './backend/src/routes/api';
import { initScheduler } from './backend/src/scheduler/dailyCron';
import { STORAGE_PATHS } from './backend/src/database/storageSetup';

// Load environment variables from .env file if available
dotenv.config();

async function startServer() {
  const app = express();
  const port = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static storage files (reports and zips)
  app.use('/storage', express.static(STORAGE_PATHS.root));
  app.use('/storage/reports', express.static(STORAGE_PATHS.reports));
  app.use('/storage/zips', express.static(STORAGE_PATHS.zips));

  // Mount API router
  app.use('/api', apiRouter);

  // Initialize Daily Automation Scheduler
  try {
    initScheduler();
  } catch (e) {
    console.error('Failed to initialize scheduler:', e);
  }

  if (!isProd) {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` Parkway Kala Settled Cases & Automation Server`);
    console.log(` Running on: http://0.0.0.0:${port}`);
    console.log(` Mode: ${isProd ? 'Production' : 'Development'}`);
    console.log(` Storage Path: ${STORAGE_PATHS.root}`);
    console.log(` Target Admin: ${process.env.PARKWAY_ADMIN_URL || 'https://admin.parkwaykala.ir'}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting Parkway Kala Server:', err);
  process.exit(1);
});
