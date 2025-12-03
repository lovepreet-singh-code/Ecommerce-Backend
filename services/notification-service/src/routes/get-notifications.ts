import express, { Request, Response } from 'express';
import { Notification } from '../models/notification';

const router = express.Router();

router.get('/api/v1/notifications/user/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { limit = '20', skip = '0', unreadOnly = 'false' } = req.query;

    const query: any = { userId };
    if (unreadOnly === 'true') {
        query.read = false;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(skip as string));

    const total = await Notification.countDocuments(query);

    res.send({
        notifications,
        total,
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
    });
});

export { router as getNotificationsRouter };
