import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'poke',
    description: 'poke someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'poke @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'poke', 'poked');
    }
};