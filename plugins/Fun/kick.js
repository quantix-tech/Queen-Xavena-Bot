import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'kick',
    description: 'Kick someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'kick @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'kick', 'kicked');
    }
};