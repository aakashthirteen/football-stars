import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);

// Debug endpoint to check authentication
router.get('/debug', authenticateToken, (req: any, res) => {
  res.json({
    message: 'Authentication successful',
    user: req.user,
    headers: req.headers
  });
});

export default router;