import { Response } from 'express';
import { AuthRequest } from '../types/express.js';

class HealthController {
  /**
   * Health check endpoint
   */
  static async getHealth(req: AuthRequest, res: Response): Promise<Response> {
    return res.status(200).json({ 
      status: 'ok', 
      message: 'All good!' 
    });
  }
}

export { HealthController}