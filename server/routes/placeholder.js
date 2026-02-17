import express from 'express';
import sharp from 'sharp';

const router = express.Router();

// Generate placeholder images
router.get('/:width/:height', async (req, res) => {
  try {
    const { width, height } = req.params;
    const { random, text, bg, color } = req.query;
    
    const w = Math.min(parseInt(width) || 400, 2000);
    const h = Math.min(parseInt(height) || 300, 2000);
    
    // Generate a simple colored rectangle with text
    const backgroundColor = bg || '#6366f1';
    const textColor = color || '#ffffff';
    const displayText = text || `${w}x${h}`;
    
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${backgroundColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" fill="${textColor}" text-anchor="middle" dy=".3em">${displayText}</text>
      </svg>
    `;
    
    const buffer = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
    
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    res.send(buffer);
  } catch (error) {
    console.error('Error generating placeholder:', error);
    res.status(500).json({ error: 'Failed to generate placeholder image' });
  }
});

export default router;