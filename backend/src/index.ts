import express from 'express';
import './config/env.js';
import cors from 'cors';
import healthcheckRouter from './routes/health.routes.js'
import { globalErrorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes';

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

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
