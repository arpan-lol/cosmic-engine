import express from 'express';
import './config/env.js';
import { validateEnvironment } from './config/env.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import healthcheckRouter from './routes/health.routes.js';
import baseRouter from './routes/base.routes.js';
import { globalErrorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import { Orchestrator } from './utils/orchestrator.util.js';
import { HealthCheck } from './utils/healthcheck.util.js';

validateEnvironment();

const app = express();
const PORT = process.env.PORT || '3006';

app.use(cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  }));
console.log('CORS enabled with credentials');

console.log(process.cwd())

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/', baseRouter)
app.use('/auth', authRoutes);
app.use('/chat', chatRoutes);

app.use(globalErrorHandler);

Orchestrator();

app.listen(PORT, async () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
  
  await HealthCheck.checkAll();
});
