import { Response } from 'express';
import { AuthRequest } from '../types';
import { CloudinaryService } from '../services/cloudinaryService';

export const uploadProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured');
      res.status(503).json({ 
        error: 'Image upload service not configured',
        details: 'Please contact administrator to set up image upload service'
      });
      return;
    }

    const { imageData, imageType = 'profile' } = req.body;

    if (!imageData) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    // Validate imageType
    const validTypes = ['profile', 'team-badge', 'cover'];
    if (!validTypes.includes(imageType)) {
      res.status(400).json({ error: 'Invalid image type' });
      return;
    }

    console.log('📤 Uploading image to Cloudinary for user:', req.user.id);

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFromBase64(
      imageData,
      imageType === 'profile' ? 'profile-pictures' : 
      imageType === 'team-badge' ? 'team-badges' : 'covers',
      `${imageType}_${req.user.id}_${Date.now()}`
    );

    console.log('✅ Image uploaded successfully:', uploadResult.secure_url);

    res.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: 'Image uploaded successfully'
    });

  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload image',
      details: error.message 
    });
  }
};

export const uploadTeamBadge = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured for team badge upload');
      res.status(503).json({ 
        error: 'Image upload service not configured',
        details: 'Please contact administrator to set up image upload service'
      });
      return;
    }

    const { imageData, teamId } = req.body;

    if (!imageData) {
      res.status(400).json({ error: 'No image data provided' });
      return;
    }

    if (!teamId) {
      res.status(400).json({ error: 'Team ID is required' });
      return;
    }

    console.log('📤 Uploading team badge to Cloudinary for team:', teamId);

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadFromBase64(
      imageData,
      'team-badges',
      `team_badge_${teamId}_${Date.now()}`
    );

    console.log('✅ Team badge uploaded successfully:', uploadResult.secure_url);

    res.json({
      success: true,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      message: 'Team badge uploaded successfully'
    });

  } catch (error: any) {
    console.error('❌ Team badge upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload team badge',
      details: error.message 
    });
  }
};