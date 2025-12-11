import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { HealthCheck } from '../utils/healthcheck.util.js';

class HealthController {
  /**
   * Health check endpoint
   */
  static async getHealth(req: AuthRequest, res: Response): Promise<Response> {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
    });
  }

  static async getDetailedHealth(req: AuthRequest, res: Response): Promise<Response> {
    const healthStatus = await HealthCheck.checkAll();
    
    const statusCode = healthStatus.overall === 'healthy' ? 200 : 503;
    
    return res.status(statusCode).json({
      status: healthStatus.overall,
      timestamp: new Date().toISOString(),
      services: healthStatus.services,
    });
  }
}

export { HealthController}