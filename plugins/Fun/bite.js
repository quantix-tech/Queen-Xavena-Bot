import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'bite',
    description: 'bite someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'bite @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'bite', 'bit');
    }
};