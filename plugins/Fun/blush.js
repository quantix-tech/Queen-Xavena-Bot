import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'blush',
    description: 'blush at someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'blush@user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'blush', ' blushed at');
    }
};