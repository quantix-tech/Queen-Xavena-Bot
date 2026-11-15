import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'lick',
    description: 'lick someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'lick @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'lick', 'licked');
    }
};