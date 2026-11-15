import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'yeet',
    description: 'yeet someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'yeet @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'yeet', 'yeeted');
    }
};