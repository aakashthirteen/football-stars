import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { uploadProfileImage, uploadTeamBadge } from '../controllers/uploadController';

const router = express.Router();

// All upload routes require authentication
router.use(authenticateToken);

// Upload profile image
router.post('/profile-image', uploadProfileImage);

// Upload team badge
router.post('/team-badge', uploadTeamBadge);

export default router;