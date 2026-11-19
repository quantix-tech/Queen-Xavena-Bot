import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'pickupline',
    aliases: ['pickup', 'flirt'],
    description: 'Get a random pickup line',
    category: 'Fun',
    ownerOnly: false,
    usage: 'pickupline',

    async execute(sock, m, args, ctx) {
        try {
            const res = await axios.get('https://api.popcat.xyz/v2/pickuplines', {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const data = res.data;

            if (data.error || !data.message?.pickupline) {
                throw new Error('Invalid response from PopCat API');
            }

            const line = data.message.pickupline;
            const contributor = data.message.contributor || 'PopCat';

            await ctx.reply(`💘 *Pickup Line*\n\n${line}\n\n_— via ${contributor}_`);

        } catch (err) {
            console.error('Pickupline error:', err.message);
            await ctx.reply('❌ Failed to fetch a pickup line. Try again later.');
        }
    }
};