# Cloudinary Setup Instructions

To enable image upload functionality in the Football Stars app, you need to set up Cloudinary environment variables on Railway.

## Steps to Configure Cloudinary:

### 1. Create a Free Cloudinary Account
1. Go to [https://cloudinary.com/](https://cloudinary.com/)
2. Click "Sign Up for Free"
3. Fill in your details and create an account

### 2. Get Your Cloudinary Credentials
1. After signing up, go to your Cloudinary Dashboard
2. You'll see your credentials in the "Account Details" section:
   - **Cloud Name**: Your unique cloud name (e.g., "dxxxxx")
   - **API Key**: A numeric key (e.g., "123456789012345")
   - **API Secret**: A secret key (keep this secure!)

### 3. Add Environment Variables to Railway
1. Go to your Railway project dashboard
2. Click on your deployed service
3. Go to the "Variables" tab
4. Click "New Variable" and add these three variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   CLOUDINARY_API_KEY=your_api_key_here
   CLOUDINARY_API_SECRET=your_api_secret_here
   ```
5. Click "Deploy" to apply the changes

### 4. Verify Setup
After deployment completes:
1. Check the Railway logs - you should NOT see the warning about missing Cloudinary variables
2. Try uploading a profile image in the app - it should work now!

## Image Storage Structure
Images are organized in folders:
- `football-stars/profile-pictures/` - User profile images
- `football-stars/team-badges/` - Team logos
- `football-stars/covers/` - Cover images

All images are automatically:
- Resized to 400x400 pixels
- Optimized for quality and performance
- Served via Cloudinary's global CDN

## Troubleshooting
If image upload still doesn't work:
1. Double-check your credentials are correct
2. Make sure there are no extra spaces in the environment variables
3. Check Railway deployment logs for any error messages
4. Ensure your Cloudinary account is active and not over quota