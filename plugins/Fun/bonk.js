import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'bonk',
    description: 'bonk someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'bonk @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'bonk', 'bonked');
    }
};