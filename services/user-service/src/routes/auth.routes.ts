import { Router } from 'express';
import { z } from 'zod';
import { register, login, refresh } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
        role: z.enum(['user', 'admin']).optional(),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);

export { router as authRoutes };
