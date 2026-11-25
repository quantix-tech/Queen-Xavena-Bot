import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'nom',
    description: 'nom someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'nom @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'nom', 'nomed');
    }
};