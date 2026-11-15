import axios from 'axios';

export default {
    command: 'truth',
    description: 'Get a random truth question',
    category: 'Fun',
    ownerOnly: false,
    usage: 'truth',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://api.truthordarebot.xyz/v1/truth');
            const question = res.data.question;
            
            await ctx.reply(`😳 *Truth*\n\n${question}`);
        } catch (err) {
            console.error('Truth error:', err.message);
            await ctx.reply('❌ Failed to fetch a truth question. Try again later.');
        }
    }
};