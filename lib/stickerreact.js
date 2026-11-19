import fs from 'fs';
import path from 'path';

const CUSTOM_STICKER_FILE = path.join(process.cwd(), 'database', 'sreact-sticker-message.json');
const MAX_STICKER_REACTION_ATTEMPTS = 10;
const STICKER_REACTION_DELAY_MS = 250;

export function getQuotedStickerMessage(quoted) {
    if (!quoted) return null;
    const message = quoted.message || quoted;
    return message.stickerMessage || message.lottieStickerMessage ||
        quoted.stickerMessage || quoted.lottieStickerMessage ||
        (quoted.mtype === 'stickerMessage' || quoted.mtype === 'lottieStickerMessage' ? quoted : null);
}

export function loadStickerReactionMessage() {
    try {
        if (!fs.existsSync(CUSTOM_STICKER_FILE)) return null;
        const saved = JSON.parse(fs.readFileSync(CUSTOM_STICKER_FILE, 'utf8'));
        if (saved && typeof saved === 'object' && (saved.stickerMessage || saved.lottieStickerMessage)) {
            return saved.stickerMessage || saved.lottieStickerMessage;
        }
        return saved && typeof saved === 'object' ? saved : null;
    } catch (error) {
        console.error('[SREACT] Could not load saved sticker:', error.message);
        return null;
    }
}

export function saveStickerReactionMessage(quoted) {
    const stickerMessage = getQuotedStickerMessage(quoted);
    if (!stickerMessage) return false;
    fs.mkdirSync(path.dirname(CUSTOM_STICKER_FILE), { recursive: true });
    fs.writeFileSync(CUSTOM_STICKER_FILE, JSON.stringify(stickerMessage, null, 2));
    return true;
}

function buildStickerReactionMessage(parentMessageKey) {
    if (!parentMessageKey || typeof parentMessageKey !== 'object' || !parentMessageKey.id) {
        throw new TypeError('A parent WhatsApp message key is required.');
    }
    const sticker = loadStickerReactionMessage();
    if (!sticker) {
        throw new Error('No sticker set. Reply to a sticker with .setsreact first.');
    }
    return {
        messageContextInfo: {
            messageAssociation: {
                associationType: 11,
                parentMessageKey,
            },
        },
        stickerMessage: { ...sticker },
    };
}

export async function sendStickerReaction(sock, jid, parentMessageKey) {
    if (!jid || !parentMessageKey?.id || typeof sock?.relayMessage !== 'function') return false;
    if (!loadStickerReactionMessage()) return false;

    try {
        await sock.relayMessage(jid, buildStickerReactionMessage(parentMessageKey), {});
        return true;
    } catch (err) {
        console.error('[SREACT] Failed to relay sticker:', err.message);
        return false;
    }
}

export function isStickerReactionMessage(message) {
    const sticker = message?.stickerMessage || message?.lottieStickerMessage;
    if (!sticker) return false;
    const saved = loadStickerReactionMessage();
    if (saved && saved.fileSha256 && sticker.fileSha256 === saved.fileSha256) return true;
    if (saved && saved.fileEncSha256 && sticker.fileEncSha256 === saved.fileEncSha256) return true;
    return sticker.mimetype === 'application/was' && sticker.isLottie === true;
}