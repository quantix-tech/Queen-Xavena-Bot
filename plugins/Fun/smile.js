import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'snile',
    description: 'smile at  someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'smile @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'smile', 'smiled at');
    }
};