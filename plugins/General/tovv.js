import { downloadContentFromMessage } from '@itsliaaa/baileys';
import { getPrefix } from '../../lib/config.js';

const TIMEOUT_MS = 30_000;

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const c of stream) chunks.push(c);
    return Buffer.concat(chunks);
}

function downloadWithTimeout(node, type) {
    return new Promise(async (resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Media download timed out')), TIMEOUT_MS);
        try {
            const stream = await downloadContentFromMessage(node, type);
            const buf = await streamToBuffer(stream);
            clearTimeout(t);
            resolve(buf);
        } catch (e) { clearTimeout(t); reject(e); }
    });
}

function resolveMedia(m) {
    const ctx = m.message?.extendedTextMessage?.contextInfo
             || m.message?.imageMessage?.contextInfo
             || m.message?.videoMessage?.contextInfo
             || m.message?.audioMessage?.contextInfo
             || null;
    const quoted = ctx?.quotedMessage || null;

    const sources = [
        quoted,
        m.message,
        quoted?.viewOnceMessage?.message,
        quoted?.viewOnceMessageV2?.message,
        quoted?.viewOnceMessageV2Extension?.message,
        quoted?.ephemeralMessage?.message,
        m.message?.viewOnceMessage?.message,
        m.message?.viewOnceMessageV2?.message,
        m.message?.ephemeralMessage?.message,
    ].filter(Boolean);

    for (const src of sources) {
        if (src.imageMessage) return { type: 'image', node: src.imageMessage };
        if (src.videoMessage) return { type: 'video', node: src.videoMessage };
        if (src.audioMessage) return { type: 'audio', node: src.audioMessage };
    }
    return null;
}

function resolveText(m, args) {
    // 1. Direct text: .tovv hello secret
    if (args.join(' ').trim()) return args.join(' ').trim();

    // 2. Quoted text ONLY — NEVER read m.message here,
    // otherwise ".tovv" alone reads itself as ".tovv" and resends it
    const ctx = m.message?.extendedTextMessage?.contextInfo
             || m.message?.imageMessage?.contextInfo
             || m.message?.videoMessage?.contextInfo
             || null;
    const quoted = ctx?.quotedMessage || null;
    if (!quoted) return null;

    const sources = [
        quoted,
        quoted?.viewOnceMessage?.message,
        quoted?.viewOnceMessageV2?.message,
        quoted?.ephemeralMessage?.message,
    ].filter(Boolean);

    for (const src of sources) {
        const t = src.conversation
               || src.extendedTextMessage?.text
               || src.imageMessage?.caption
               || src.videoMessage?.caption
               || null;
        if (t?.trim()) return t.trim();
    }
    return null;
}

export default {
    command: 'tovv',
    aliases: ['tovo'],
    description: 'Re-send media / text as a view-once message',
    category: 'General',
    ownerOnly: false,
    usage: 'tovv (reply to media/text) | tovv <text> | tovv <caption>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const jid = m.key.remoteJid;
        const found = resolveMedia(m);

        // ─── TEXT MODE — no media, but text exists ───
        if (!found) {
            const text = resolveText(m, args);
            if (!text) {
                return ctx.reply(`👁️ *To View-Once*\n\nReply to (or attach) an image, video, voice note, or text with:\n\`${prefix}tovv\`\n\nOr send text directly:\n\`${prefix}tovv hello this is secret\`\n\nThe bot will re-send it as a *view-once* message.`);
            }

            try {
                await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});
                // Text needs viewOnceMessage wrapper — { text, viewOnce: true } sends normal text
                await sock.sendMessage(jid, {
                    viewOnceMessage: {
                        message: {
                            extendedTextMessage: { text }
                        }
                    }
                }, { quoted: m });
                await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});
            } catch (e) {
                console.error('[tovv:send-text]', e.message);
                await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
                return ctx.reply('❌ Failed to send view-once text: ' + e.message);
            }
            return;
        }

        // ─── MEDIA MODE ───
        const { type, node } = found;
        const caption = args.join(' ').trim();

        await sock.sendMessage(jid, { react: { text: '⏳', key: m.key } }).catch(() => {});

        let buf;
        try {
            buf = await downloadWithTimeout(node, type);
            if (!buf || buf.length < 100) throw new Error('empty media buffer');
        } catch (e) {
            console.error('[tovv:download]', e.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
            return ctx.reply('❌ Could not download that media: ' + e.message);
        }

        try {
            const payload = { viewOnce: true };
            if (type === 'image') {
                payload.image = buf;
                payload.mimetype = node.mimetype || 'image/jpeg';
                if (caption) payload.caption = caption;
            } else if (type === 'video') {
                payload.video = buf;
                payload.mimetype = node.mimetype || 'video/mp4';
                if (caption) payload.caption = caption;
            } else {
                payload.audio = buf;
                payload.mimetype = node.mimetype || 'audio/ogg; codecs=opus';
                payload.ptt = node.ptt !== false;
            }

            await sock.sendMessage(jid, payload, { quoted: m });
            await sock.sendMessage(jid, { react: { text: '✅', key: m.key } }).catch(() => {});
        } catch (e) {
            console.error('[tovv:send]', e.message);
            await sock.sendMessage(jid, { react: { text: '❌', key: m.key } }).catch(() => {});
            return ctx.reply('❌ Failed to send view-once: ' + e.message);
        }
    }
};