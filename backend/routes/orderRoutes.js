import { Router } from 'express';
import {
  confirmOrderPayment,
  createOrder,
  getAllOrders,
  getMyOrders,
  updateOrderStatus,
} from '../controllers/orderController.js';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/', authenticateToken, createOrder);
router.get('/my', authenticateToken, getMyOrders);
router.post('/:id/pay', authenticateToken, confirmOrderPayment);
router.get('/', authenticateToken, requireAdmin, getAllOrders);
router.patch('/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

export default router;
