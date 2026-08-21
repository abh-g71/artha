import { Request, Response, NextFunction } from 'express';
import { parseIntent } from '../services/intentService';

export async function extractIntent(req: Request, res: Response, next: NextFunction) {
  try {
    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
      const err: any = new Error('Invalid request: `text` is required');
      err.status = 400;
      throw err;
    }

    const intent = await parseIntent(text);

    res.json({ intent });
  } catch (err) {
    next(err);
  }
}
