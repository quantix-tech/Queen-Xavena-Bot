import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'highfive',
    description: 'highfive someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'highfive @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'highfive', 'high-fived');
    }
};