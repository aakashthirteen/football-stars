const cloudinary = require('cloudinary').v2;

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dgxdkhxqo', // Default free account
  api_key: process.env.CLOUDINARY_API_KEY || '925437891254279',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'nXrJu8aNJ5Zr7JO4ZHCK3XYG5F4',
});

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param imageBuffer Buffer of the image
   * @param folder Folder to upload to (e.g., 'profile-pictures', 'team-badges')
   * @param publicId Optional public ID for the image
   * @returns Promise with Cloudinary upload result
   */
  static async uploadImage(
    imageBuffer: Buffer, 
    folder: string, 
    publicId?: string
  ): Promise<any> {
    try {
      return new Promise((resolve, reject) => {
        const uploadOptions: any = {
          resource_type: 'image',
          folder: `football-stars/${folder}`,
          transformation: [
            { width: 400, height: 400, crop: 'fill', quality: 'auto' },
            { fetch_format: 'auto' }
          ],
        };

        if (publicId) {
          uploadOptions.public_id = publicId;
        }

        cloudinary.uploader.upload_stream(
          uploadOptions,
          (error: any, result: any) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              console.log('Cloudinary upload success:', result.secure_url);
              resolve(result);
            } else {
              reject(new Error('No result from Cloudinary'));
            }
          }
        ).end(imageBuffer);
      });
    } catch (error) {
      console.error('Cloudinary service error:', error);
      throw error;
    }
  }

  /**
   * Upload image from base64 string
   * @param base64Image Base64 encoded image string
   * @param folder Folder to upload to
   * @param publicId Optional public ID
   * @returns Promise with Cloudinary upload result
   */
  static async uploadFromBase64(
    base64Image: string, 
    folder: string, 
    publicId?: string
  ): Promise<any> {
    try {
      const uploadOptions: any = {
        resource_type: 'image',
        folder: `football-stars/${folder}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', quality: 'auto' },
          { fetch_format: 'auto' }
        ],
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      const result = await cloudinary.uploader.upload(base64Image, uploadOptions);
      console.log('Cloudinary base64 upload success:', result.secure_url);
      return result;
    } catch (error) {
      console.error('Cloudinary base64 upload error:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId Public ID of the image to delete
   * @returns Promise with deletion result
   */
  static async deleteImage(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary delete success:', result);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }
}