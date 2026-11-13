// Queen Xavena — Media download helper.
// Downloads media from the current message, or falls back to the quoted
// message when the current one has none. Returns a null-safe object.

import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

// Message types that carry downloadable media.
const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'ptvMessage',       // round video note
    'stickerMessage',
    'documentMessage'
]);

const silentLogger = pino({ level: 'silent' });

/**
 * Is this message type a media type?
 * @param {string|null} type
 * @returns {boolean}
 */
export function isMediaType(type) {
    return type ? MEDIA_TYPES.has(type) : false;
}

/**
 * Download media and return it with a shape plugins can branch on.
 *
 * Priority:
 *   1. Current message — if it has media
 *   2. Quoted message — if the current one doesn't, and quoted does
 *   3. null — neither has media
 *
 * @param {object} sock     — Baileys socket
 * @param {object} raw      — unwrapped current message
 * @param {object|null} quotedMsg — unwrapped quoted message (or null)
 * @returns {Promise<{
 *   buffer: Buffer,
 *   mimetype: string,
 *   type: string,
 *   isImage: boolean,
 *   isVideo: boolean,
 *   isAudio: boolean,
 *   isSticker: boolean,
 *   isDocument: boolean
 * } | null>}
 */
export async function resolveMedia(sock, raw, quotedMsg) {
    if (!raw && !quotedMsg) return null;

    // Pick the source message
    let source = null;
    let sourceType = null;

    const rawType = raw ? Object.keys(raw)[0] : null;
    if (isMediaType(rawType)) {
        source = raw;
        sourceType = rawType;
    } else if (quotedMsg) {
        const qType = Object.keys(quotedMsg)[0];
        if (isMediaType(qType)) {
            source = quotedMsg;
            sourceType = qType;
        }
    }

    if (!source) return null;

    // Wrapped in an object so Baileys knows it's a real message
    const wrapper = { message: source, key: { remoteJid: '' } };

    try {
        const buffer = await downloadMediaMessage(
            wrapper,
            'buffer',
            {},
            { logger: silentLogger, reuploadRequest: sock.updateMediaMessage }
        );

        if (!buffer || !buffer.length) return null;

        const inner = source[sourceType];
        const mimetype = inner?.mimetype || 'application/octet-stream';

        return {
            buffer,
            mimetype,
            type: sourceType,
            isImage:    sourceType === 'imageMessage',
            isVideo:    sourceType === 'videoMessage' || sourceType === 'ptvMessage',
            isAudio:    sourceType === 'audioMessage',
            isSticker:  sourceType === 'stickerMessage',
            isDocument: sourceType === 'documentMessage'
        };
    } catch (err) {
        // Download can fail for many reasons: expired media URL, sender
        // went offline mid-transfer, network hiccup, deleted content.
        // Return null rather than throw so plugins can reply cleanly.
        console.error('[media] download failed:', err?.message || err);
        return null;
    }
}