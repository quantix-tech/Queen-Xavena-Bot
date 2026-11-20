import axios from 'axios';

export default {
    command: 'couplepp',
    aliases: ['couple'],
    description: 'Get random matching couple profile pictures',
    category: 'Tools',
    ownerOnly: false,
    usage: 'couplepp',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://api-rebix.zone.id/api/couplepp', { timeout: 30000 });
            const data = res.data;

            if (!data.status || !data.data || !data.data.male || !data.data.female) {
                return ctx.reply(`❌ *Error*\n\nCould not fetch couple profile pictures.\n_Try again later._`);
            }

            const { male, female } = data.data;

            // Send male first
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: male },
                caption: `💙 *Male*\n_Queen Xavena_`
            }, { quoted: m });

            // Then female
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: female },
                caption: `💗 *Female*\n_Queen Xavena_`
            }, { quoted: m });

        } catch (error) {
            console.error('Couplepp error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to fetch couple pictures.\n_Note:_ ${error.message}`);
        }
    }
};