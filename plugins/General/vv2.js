import { getStored } from '../../lib/vvstore.js';
import { getPrefix } from '../../lib/config.js';
import { getRealJid, extractRawId } from '../../lib/utils.js';
import { downloadMediaMessage } from '@itsliaaa/baileys';
import pino from 'pino';

const silentLogger = pino({ level: 'silent' });

function unwrapViewOnce(message) {
    let cur = message;
    let viewOnce = false;
    for (let i = 0; i < 6 && cur; i++) {
        const vo = cur.viewOnceMessage || cur.viewOnceMessageV2 || cur.viewOnceMessageV2Extension;
        if (vo?.message) { viewOnce = true; cur = vo.message; continue; }
        const wrap = cur.ephemeralMessage || cur.documentWithCaptionMessage;
        if (wrap?.message) { cur = wrap.message; continue; }
        break;
    }
    const type = cur?.imageMessage ? 'image'
        : cur?.videoMessage ? 'video'
        : cur?.audioMessage ? 'audio'
        : null;
    return { cur, type, media: type ? cur[`${type}Message`] : null, viewOnce };
}

export default {
    command: 'vv2',
    description: 'Send view-once media silently to the bot DM',
    category: 'General',
    ownerOnly: false,
    usage: 'vv2 (reply to view-once)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted?.key?.id) {
            return ctx.reply(`❌ *View Once*\n\nReply to a view-once media with \`${prefix}vv2\`\n_Note: The media will be sent to the bot\'s DM silently._`);
        }

        const vvKey = {
            remoteJid: m.key.remoteJid,
            id: ctx.quoted.key.id,
            ...(ctx.quoted.key.participant ? { participant: ctx.quoted.key.participant } : {}),
            ...(m.key.remoteJidAlt ? { remoteJidAlt: m.key.remoteJidAlt } : {})
        };

        const sources = [];
        const stored = getStored(vvKey);
        if (stored) sources.push(stored);
        if (ctx.quoted.message) sources.push(ctx.quoted.message);

        if (!sources.length) {
            return ctx.reply('❌ The bot has no copy of that message. It was probably sent before the bot started.');
        }

        let found = null;
        let buffer = null;

        for (const source of sources) {
            const u = unwrapViewOnce(source);
            if (!u.type) continue;
            try {
                buffer = await downloadMediaMessage(
                    { key: vvKey, message: u.cur },
                    'buffer',
                    {},
                    { logger: silentLogger, reuploadRequest: msg => sock.updateMediaMessage(msg) }
                );
                if (buffer?.length) { found = u; break; }
            } catch (_) {}
            buffer = null;
        }

        if (!found || !buffer?.length) {
            return ctx.reply('❌ Failed to download view-once media.');
        }

        const senderJid = m.key.participant || m.key.remoteJid;
        const realNumber = await getRealJid(senderJid, sock);
        const senderName = m.pushName || realNumber || 'Unknown User';
        const botJid = extractRawId(sock.user.id) + '@s.whatsapp.net';

        const caption = `🔓 *View-Once ${found.type}*\nFrom: ${senderName}${found.media?.caption ? `\n📝 ${found.media.caption}` : ''}`;

        try {
            if (found.type === 'image') {
                await sock.sendMessage(botJid, { image: buffer, caption, mimetype: found.media?.mimetype || 'image/jpeg' });
            } else if (found.type === 'video') {
                await sock.sendMessage(botJid, { video: buffer, caption, mimetype: found.media?.mimetype || 'video/mp4' });
            } else {
                await sock.sendMessage(botJid, { audio: buffer, mimetype: found.media?.mimetype || 'audio/ogg; codecs=opus', ptt: !!found.media?.ptt });
                await sock.sendMessage(botJid, { text: caption });
            }
            await sock.sendMessage(m.key.remoteJid, { delete: m.key });
        } catch (err) {
            console.error('VV2 error:', err);
            await ctx.reply('❌ Failed to process media.');
        }
    }
};