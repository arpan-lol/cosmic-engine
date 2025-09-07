import { Router } from 'express';
import { HealthController } from '../controllers/health.controllers.js';

const router = Router();

router.get('/', HealthController.getHealth);

export default router;