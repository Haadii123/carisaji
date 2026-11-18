import { Router } from 'express';
import { createReview } from '../controllers/reviewController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/:restaurantId', authenticateToken, createReview);

export default router;
