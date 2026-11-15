import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'kill',
    description: 'Kill someone (anime style)',
    category: 'Fun',
    ownerOnly: false,
    usage: 'kill @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'kill', 'killed');
    }
};