import { Router } from 'express';
import {
  getMenusByRestaurant,
  createMenu,
  deleteMenu,
} from '../controllers/menuController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/restaurant/:restaurantId', getMenusByRestaurant);
router.post('/', authenticateToken, requireAdmin, createMenu);
router.delete('/:id', authenticateToken, requireAdmin, deleteMenu);

export default router;
