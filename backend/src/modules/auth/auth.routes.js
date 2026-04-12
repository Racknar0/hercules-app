import { Router } from 'express';
import { login, logout, me } from './auth.controller.js';

const router = Router();

router.post('/api/auth/login', login);

router.get('/api/auth/me', me);

router.post('/api/auth/logout', logout);

export default router;
