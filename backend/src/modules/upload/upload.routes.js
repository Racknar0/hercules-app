import { Router } from 'express';
import multer from 'multer';
import { uploadDocuments } from './upload.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/api/upload', upload.array('files'), uploadDocuments);

export default router;
