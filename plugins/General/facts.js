import axios from 'axios';

export default {
    command: 'fact',
    description: 'Get a random useless fact',
    category: 'General',
    ownerOnly: false,
    usage: 'fact',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 10000 });
            await ctx.reply(`💡 *Random Fact*\n\n${res.data.text}`);
        } catch (e) {
            await ctx.reply(`❌ Failed to fetch fact. Try again later.`);
        }
    }
};