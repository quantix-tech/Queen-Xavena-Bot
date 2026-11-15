import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'handhold',
    description: 'handhold someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'handhold @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'handhlold', 'held hands with');
    }
};