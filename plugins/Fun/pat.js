import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'pat',
    description: 'pat someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'pat @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'pat', 'patted');
    }
};