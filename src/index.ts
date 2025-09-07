import express from 'express';
import './config/env.js';
import cors from 'cors';
import healthcheckRouter from './routes/health.routes.js'
import { globalErrorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || '3003';

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
  console.log('CORS enabled');
}

console.log(process.cwd())
app.use(express.json());
app.use('/api/v1/healthcheck', healthcheckRouter);

app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
