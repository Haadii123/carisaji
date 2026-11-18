import { Router } from 'express';
import {
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
} from '../controllers/restaurantController.js';
import { createReview } from '../controllers/reviewController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getAllRestaurants);
router.get('/:id', getRestaurantById);
router.post('/', authenticateToken, requireAdmin, createRestaurant);
router.put('/:id', authenticateToken, requireAdmin, updateRestaurant);
router.delete('/:id', authenticateToken, requireAdmin, deleteRestaurant);
router.post('/:restaurantId/reviews', authenticateToken, createReview);

export default router;
