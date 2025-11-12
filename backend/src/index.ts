import express from 'express';
import './config/env.js';
import { validateEnvironment } from './config/env';
import cors from 'cors';
import healthcheckRouter from './routes/health.routes.js'
import { globalErrorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import { Orchestrator } from './utils/orchestrator.util';
import { HealthCheck } from './utils/healthcheck.util';

validateEnvironment();

const app = express();
const PORT = process.env.PORT || '3006';

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
  console.log('CORS enabled');
}

console.log(process.cwd())

app.use(express.json());
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

app.use(globalErrorHandler);

Orchestrator();

app.listen(PORT, async () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  
  await HealthCheck.checkAll();
});
