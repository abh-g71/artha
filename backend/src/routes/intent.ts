import { Router } from 'express';
import { extractIntent } from '../controllers/intentController';

const router = Router();

router.post('/', extractIntent);

export default router;
