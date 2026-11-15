import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'smug',
    description: 'smug someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'smug @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'smug', 'smugged at');
    }
};