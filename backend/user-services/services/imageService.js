import sharp from 'sharp';

class ImageService {
    async processImage(buffer) {
        try {
            const processedImageBuffer = await sharp(buffer) //resize img to 1280x720
                .resize(1280, 720, {
                    fit: 'cover',
                    position: 'center'
                })
                .webp({
                    quality: 50, // Lower quality to reduce size
                    effort: 6, 
                    lossless: false
                })
                .toBuffer();

            return processedImageBuffer;
        } catch (error) {
            console.error('Error processing image:', error);
            throw error;
        }
    }
}

export default new ImageService();
