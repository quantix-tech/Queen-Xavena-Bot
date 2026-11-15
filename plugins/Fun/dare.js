import axios from 'axios';

export default {
    command: 'dare',
    description: 'Get a random dare challenge',
    category: 'Fun',
    ownerOnly: false,
    usage: 'dare',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://api.truthordarebot.xyz/v1/dare');
            const question = res.data.question;
            
            await ctx.reply(`😈 *Dare*\n\n${question}`);
        } catch (err) {
            console.error('Dare error:', err.message);
            await ctx.reply('❌ Failed to fetch a dare challenge. Try again later.');
        }
    }
};