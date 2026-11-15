import { setAFK } from '../../handlers/afk.js';
import { getRealJid } from '../../lib/utils.js';

export default {
    command: 'afk',
    description: 'Set yourself as Away From Keyboard',
    category: 'General',
    ownerOnly: false,
    usage: 'afk <reason>',

    async execute(sock, m, args, ctx) {
        const reason = args.join(' ') || 'AFK';
        const sender = await getRealJid(m.key.participant || m.key.remoteJid, sock);

        setAFK(sender, reason);

        await ctx.reply(`💤 *AFK Mode Enabled*\n\n@${sender} is now AFK.\n*Reason:* ${reason}`, {
            mentions: [m.key.participant || m.key.remoteJid]
        });
    }
};