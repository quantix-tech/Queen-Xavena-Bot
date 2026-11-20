import { getGroupMetadata, isSenderAdmin, isBotAdmin } from '../../lib/utils.js';

export default {
    command: 'closetime',
    description: 'Close the group after a specific time',
    category: 'Group',
    ownerOnly: false,
    usage: 'closetime <time> (e.g. 10m, 1h)',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        if (!jid.endsWith('@g.us')) return ctx.reply('❌ Group only.');
        if (!args[0]) return ctx.reply('❌ Provide time (e.g., `10m`, `1h`).');

        try {
            const metadata = await getGroupMetadata(sock, jid);
            const isAdmin = await isSenderAdmin(sock, jid, m.key.participant, metadata);
            const isBot = await isBotAdmin(sock, jid, metadata);

            if (!isAdmin) return ctx.reply('❌ Admins only.');
            if (!isBot) return ctx.reply('❌ I need admin rights.');

            // Parse time
            const timeStr = args[0];
            const match = timeStr.match(/^(\d+)([smh])$/);
            if (!match) return ctx.reply('❌ Invalid format. Use `10s`, `5m`, or `1h`.');

            const value = parseInt(match[1]);
            const unit = match[2];
            let ms = value * 1000;
            if (unit === 'm') ms = value * 60000;
            if (unit === 'h') ms = value * 3600000;

            await ctx.reply(`🔒 *Group will close in ${timeStr}*`);

            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(jid, 'announcement');
                    await sock.sendMessage(jid, { text: '🔒 *Group Closed*\nOnly admins can send messages now.' });
                } catch (e) { console.error(e); }
            }, ms);

        } catch (err) { return ctx.reply(`❌ Error: ${err.message}`); }
    }
};