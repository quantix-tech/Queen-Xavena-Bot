import fs from 'node:fs';
import { getPrefix } from '../../lib/config.js';
import { downloadMediaMessage, encryptedStream } from '@itsliaaa/baileys';
import { __stThemeSend, __stThemeNeedRestart, __stThemeRestartSoon, __stWallpaperFixMappings } from '../../lib/theme.js';

export default {
    command: 'wallpaper',
    description: 'Set custom background image for everyone in this chat',
    category: 'Themes',
    ownerOnly: true,
    usage: 'wallpaper (reply to image) / wallpaper <image-url>',

    async execute(sock, m, args, ctx) {
        const prefix = ctx.prefix || await getPrefix() || '.';
        if (__stThemeNeedRestart()) {
            __stThemeRestartSoon();
            return ctx.reply(`Server patch installed — restarting the bot once to load it. Run ${prefix}wallpaper again in ~20 seconds.`);
        }
        try {
            const _ctx = (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) || (m.message && m.message.imageMessage && m.message.imageMessage.contextInfo) || (m.message && m.message.videoMessage && m.message.videoMessage.contextInfo);
            const _qm = _ctx && _ctx.quotedMessage;
            let _media = null;
            if (_qm && _qm.imageMessage) {
                const _quoted = {
                    key: {
                        remoteJid: m.key.remoteJid,
                        id: _ctx.stanzaId,
                        ...(_ctx.participant ? { participant: _ctx.participant } : {}),
                        ...(m.key.remoteJidAlt ? { remoteJidAlt: m.key.remoteJidAlt } : {})
                    },
                    message: _qm
                };
                const _buf = await downloadMediaMessage(_quoted, 'buffer', {}, { logger: sock.logger });
                if (!Buffer.isBuffer(_buf) || _buf.length === 0) return ctx.reply('Could not download that image. Try again.');
                _media = _buf;
            } else if (ctx.quoted && ctx.quoted.message && ctx.quoted.message.imageMessage) {
                const _buf = await downloadMediaMessage({ key: { remoteJid: m.key.remoteJid, id: ctx.quoted.id || _ctx?.stanzaId, participant: ctx.quoted.sender }, message: ctx.quoted.message }, 'buffer', {}, { logger: sock.logger });
                if (!Buffer.isBuffer(_buf) || _buf.length === 0) return ctx.reply('Could not download that image. Try again.');
                _media = _buf;
            } else if (args[0] && /^https?:\/\//i.test(args[0])) {
                _media = { url: args[0] };
            } else {
                return ctx.reply(`WALLPAPER — custom background image for everyone in this chat\n\nReply to an image with ${prefix}wallpaper, or send ${prefix}wallpaper <image-url>\n\nThe image becomes the chat background for everyone. ${prefix}theme off removes it.`);
            }
            __stWallpaperFixMappings();
            if (typeof encryptedStream !== 'function') return ctx.reply('Wallpaper failed: this Baileys version has no encryptedStream.');
            const _enc = await encryptedStream(_media, 'chat-wallpaper-image', { logger: sock.logger });
            let _directPath = null;
            try {
                const _up = await sock.waUploadToServer(_enc.encFilePath, { mediaType: 'chat-wallpaper-image', fileEncSha256B64: _enc.fileEncSha256.toString('base64') });
                _directPath = _up && _up.directPath;
            } finally {
                await fs.promises.unlink(_enc.encFilePath).catch(() => {});
            }
            if (!_directPath) return ctx.reply('Wallpaper upload failed — the server returned no directPath.');
            const _s = await __stThemeSend(sock, m.key.remoteJid, { customImage: { directPath: _directPath, mediaKey: _enc.mediaKey, fileEncSha256: _enc.fileEncSha256, fileSha256: _enc.fileSha256, dimLevel: 0 } }, ctx.reply, `${prefix}wallpaper`);
            if (_s !== 'sent') return;
            return ctx.reply('Wallpaper set for everyone in this chat.');
        } catch (e) {
            return ctx.reply('Wallpaper failed: ' + (e && e.message ? e.message : String(e)));
        }
    }
};