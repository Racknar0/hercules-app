import { Router } from 'express';
import {
    checkFiles,
    getQaData,
    qaStatus,
    runQa,
} from './qa.controller.js';

const router = Router();

router.get('/api/qa-data', getQaData);
router.get('/api/check-files', checkFiles);
router.get('/api/qa-status', qaStatus);
router.post('/api/run-qa', runQa);

export default router;
