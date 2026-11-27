import { getPrefix } from '../../lib/config.js';

const DEVICE_LABELS = {
    ios: 'iPhone (iOS)',
    android: 'Android',
    web: 'WhatsApp Web',
    desktop: 'WhatsApp Desktop',
    unknown: 'Unknown device',
};

export default {
    command: 'device',
    description: 'Detect the device a message was sent from',
    category: 'Tools',
    ownerOnly: false,
    usage: 'device (reply to a message)',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();

        try {
            const contextInfo = m.message?.extendedTextMessage?.contextInfo || {};
            const quotedMessage = contextInfo?.quotedMessage;
            const stanzaId = contextInfo?.stanzaId;

            if (!quotedMessage && !stanzaId) {
                return ctx.reply(`❌ *Device*\n\nReply to a message with ${prefix}device`);
            }

            const quotedId = stanzaId || quotedMessage?.key?.id || quotedMessage?.id;
            if (!quotedId) {
                return ctx.reply('❌ Cannot detect device.');
            }

            const participant = contextInfo?.participant || ctx.quoted?.sender || m.key.participant || m.key.remoteJid;
            const device = detectDevice(quotedId);
            const label = DEVICE_LABELS[device] || DEVICE_LABELS.unknown;
            const num = String(participant).split('@')[0];

            return ctx.reply(`@${num}: *${label}*`, {
                mentions: [participant]
            });
        } catch (err) {
            console.error('Device error:', err);
            await ctx.reply('❌ Device check failed.');
        }
    }
};

function detectDevice(messageId) {
    const id = String(messageId || '').trim().toUpperCase();
    if (!id) return 'unknown';
    if (id.startsWith('3EB0')) return 'web';
    if (id.startsWith('3A')) return 'ios';
    if (id.startsWith('3F') || id.startsWith('BAE5')) return 'desktop';
    if (/^[0-9A-F]{16,40}$/.test(id)) return 'android';
    return 'unknown';
}