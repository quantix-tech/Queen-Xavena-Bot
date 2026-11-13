import axios from 'axios';
import { getLinkPreview } from 'link-preview-js';

export async function buildLinkPreview(url) {
    try {
        const preview = await getLinkPreview(url, { 
            timeout: 5000, 
            headers: { "user-agent": "Mozilla/5.0" } 
        });

        // Baileys requires a Buffer for the thumbnail
        let jpegThumbnail = null;
        if (preview.images && preview.images.length > 0) {
            try {
                const imgRes = await axios.get(preview.images[0], { responseType: 'arraybuffer' });
                jpegThumbnail = Buffer.from(imgRes.data);
            } catch (e) {
                console.error('Failed to download preview image:', e.message);
            }
        }

        return {
            'canonical-url': preview.url,
            'matched-text': preview.url,
            title: preview.title || 'No Title',
            description: preview.description || 'No Description',
            jpegThumbnail: jpegThumbnail,
            highQualityThumbnail: preview.images && preview.images.length > 0 
                ? { url: preview.images[0] } 
                : null,
            renderLargerThumbnail: true
        };
    } catch (err) {
        console.error('Link preview error:', err.message);
        return null;
    }
}