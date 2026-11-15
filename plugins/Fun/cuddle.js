import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'cuddle',
    description: 'Cuddle someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'cuddle @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'cuddle', 'cuddled');
    }
};