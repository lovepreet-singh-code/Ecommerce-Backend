import { Router } from 'express';
import { z } from 'zod';
import { getMe, updateMe } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';

const router = Router();

const updateMeSchema = z.object({
    body: z.object({
        name: z.string().min(2).optional(),
        addresses: z.array(z.string()).optional(),
    }),
});

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, validate(updateMeSchema), updateMe);

export { router as userRoutes };
