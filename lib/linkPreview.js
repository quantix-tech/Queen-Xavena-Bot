import axios from 'axios';
import { getLinkPreview } from 'link-preview-js';

// 👇 Add this helper function
export function getChannelContext() {
    return {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterName: "👑",
            newsletterJid: "120363406549205665@newsletter", // Your channel ID
            serverMessageId: -1
        }
    };
}

export async function buildLinkPreview(url) {
    try {
        const preview = await getLinkPreview(url, { 
            timeout: 5000, 
            headers: { "user-agent": "Mozilla/5.0" } 
        });

        let jpegThumbnail = null;
        if (preview.images && preview.images.length > 0) {
            try {
                const imgRes = await axios.get(preview.images[0], { responseType: 'arraybuffer' });
                jpegThumbnail = Buffer.from(imgRes.data);
            } catch (e) {}
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

// 👇 Random Status Colors
const STATUS_COLORS = ['#0A5C36', '#0B4D71', '#4A154B', '#8B1C1C', '#34495E', '#1E1E1E'];
export function getRandomStatusColor() {
    return STATUS_COLORS[Math.floor(Math.random() * STATUS_COLORS.length)];
}