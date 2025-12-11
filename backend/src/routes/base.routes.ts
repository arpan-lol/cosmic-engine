import { Router } from 'express';
import { HealthController } from '../controllers/health.controller.js';
import { Request, Response } from 'express';

const router = Router();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://cosmicengine.arpantaneja.dev"

router.get('/', (req: Request, res:Response)=>{
    res.status(200).send(`Welcome to cosmic engine! The API isnt public yet, please visit ${FRONTEND_ORIGIN}.`)
});

export default router;