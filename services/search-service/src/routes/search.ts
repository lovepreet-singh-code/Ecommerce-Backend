import express, { Request, Response } from 'express';
import { searchService } from '../search-service';

const router = express.Router();

router.get('/api/v1/search', async (req: Request, res: Response) => {
    const { q, limit = '20' } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).send({ error: 'Query parameter "q" is required' });
    }

    const results = await searchService.adapter.search(q, parseInt(limit as string));

    res.send({
        query: q,
        results,
        total: results.length,
    });
});

export { router as searchRouter };
