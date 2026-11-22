import axios from 'axios';

export default {
    command: 'catfact',
    description: 'Get a random cat fact',
    category: 'General',
    ownerOnly: false,
    usage: 'catfact',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://catfact.ninja/fact', { timeout: 10000 });
            await ctx.reply(`🐱 *Cat Fact*\n\n${res.data.fact}`);
        } catch (e) {
            await ctx.reply(`❌ Failed to fetch cat fact. Try again later.`);
        }
    }
};