import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'wave',
    description: 'wave someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'wave @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'wave', 'waved at');
    }
};