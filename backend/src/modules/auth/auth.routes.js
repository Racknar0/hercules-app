import { Router } from 'express';
import {
    extractBearerToken,
    getAuthenticatedUserByToken,
    loginWithPassword,
    logoutByToken,
} from './auth.service.js';

const router = Router();

router.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son requeridos.' });
        }

        const auth = await loginWithPassword({
            email,
            password,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || null,
        });

        if (!auth) {
            return res.status(401).json({ error: 'Credenciales invalidas.' });
        }

        return res.json({
            success: true,
            token: auth.token,
            role: auth.user.role,
            user: auth.user,
            expiresAt: auth.expiresAt.toISOString(),
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ error: 'Error interno en login.' });
    }
});

router.get('/api/auth/me', async (req, res) => {
    try {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ error: 'No autorizado.' });
        }

        const auth = await getAuthenticatedUserByToken(token);
        if (!auth) {
            return res.status(401).json({ error: 'Sesion invalida o expirada.' });
        }

        return res.json({
            success: true,
            role: auth.user.role,
            user: auth.user,
        });
    } catch (error) {
        console.error('Auth me error:', error);
        return res.status(500).json({ error: 'Error interno consultando sesion.' });
    }
});

router.post('/api/auth/logout', async (req, res) => {
    try {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            return res.json({ success: true, revoked: 0 });
        }

        const revoked = await logoutByToken(token);
        return res.json({ success: true, revoked });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ error: 'Error interno en logout.' });
    }
});

export default router;
