import { Router } from 'express';
import { cancel, clearQa, health } from './system.controller.js';

const router = Router();

router.get('/api/health', health);

router.post('/api/cancel', cancel);

router.post('/api/clear-qa', clearQa);

export default router;
