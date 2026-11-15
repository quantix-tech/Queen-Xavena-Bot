import axios from 'axios';

export default {
    command: 'quote',
    description: 'Get a random inspirational quote',
    category: 'Fun',
    ownerOnly: false,
    usage: 'quote',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://zenquotes.io/api/random', { timeout: 10000 });
            const quote = res.data[0].q;
            const author = res.data[0].a;

            if (!quote) throw new Error('No quote found');

            await ctx.reply(`💭 *Quote*\n\n"${quote}"\n\n— ${author}`);

        } catch (err) {
            console.error('Quote error:', err.message);
            await ctx.reply('❌ Failed to fetch a quote. Try again later.');
        }
    }
};