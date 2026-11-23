import { getStored } from '../../lib/vvstore.js';
import { getPrefix } from '../../lib/config.js';
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
    command: 'vv',
    description: 'Reveal and send a view-once media',
    category: 'General',
    ownerOnly: false,
    usage: 'vv (reply to view-once)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        if (!ctx.quoted?.key?.id) {
            return ctx.reply(`❌ *View Once*\n\nReply to a view-once image, video, or voice note with \`${prefix}vv\``);
        }

        const vvKey = {
            remoteJid: m.key.remoteJid,
            id: ctx.quoted.key.id,
            ...(ctx.quoted.key.participant ? { participant: ctx.quoted.key.participant } : {}),
            ...(m.key.remoteJidAlt ? { remoteJidAlt: m.key.remoteJidAlt } : {})
        };

        const sources = [];
        const stored = getStored(vvKey);
        if (stored) sources.push(['store', stored]);
        if (ctx.quoted.message) sources.push(['quoted', ctx.quoted.message]);

        if (!sources.length) {
            return ctx.reply('❌ *View Once*\n\nThe bot has no copy of that message. It was likely sent before the bot started or while it was offline.');
        }

        let found = null;
        let buffer = null;

        for (const [, source] of sources) {
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

        const caption = found.media?.caption || `🔓 *View-Once ${found.type}*`;

        try {
            if (found.type === 'image') {
                await sock.sendMessage(m.key.remoteJid, { image: buffer, caption, mimetype: found.media?.mimetype || 'image/jpeg' }, { quoted: m });
            } else if (found.type === 'video') {
                await sock.sendMessage(m.key.remoteJid, { video: buffer, caption, mimetype: found.media?.mimetype || 'video/mp4' }, { quoted: m });
            } else {
                await sock.sendMessage(m.key.remoteJid, {
                    audio: buffer,
                    mimetype: found.media?.mimetype || 'audio/ogg; codecs=opus',
                    ptt: !!found.media?.ptt
                }, { quoted: m });
            }
            await ctx.react('✅');
        } catch (err) {
            console.error('VV error:', err);
            await ctx.react('❌');
            await ctx.reply('❌ Failed to send media.');
        }
    }
};