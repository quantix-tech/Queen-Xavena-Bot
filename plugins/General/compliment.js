import axios from 'axios';

export default {
    command: 'compliment',
    description: 'Get a random compliment',
    category: 'General',
    ownerOnly: false,
    usage: 'compliment',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://complimentr.com/api', { timeout: 10000 });
            await ctx.reply(`💖 *Compliment*\n\n${res.data.compliment}`);
        } catch (e) {
            await ctx.reply(`❌ Failed to fetch compliment. Try again later.`);
        }
    }
};