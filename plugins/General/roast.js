import axios from 'axios';

export default {
    command: 'roast',
    description: 'Get a random roast',
    category: 'General',
    ownerOnly: false,
    usage: 'roast',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://prexzyapis.com/roast', { timeout: 10000 });
            const roast = res.data.result || res.data.roast || "You're so slow, you make dial-up look fast.";
            await ctx.reply(`🔥 *Roast*\n\n${roast}`);
        } catch (e) {
            await ctx.reply(`❌ Failed to fetch roast. Try again later.`);
        }
    }
};