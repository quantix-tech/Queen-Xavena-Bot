import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'bully',
    description: 'bully someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'bully @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'bully', 'bullied');
    }
};