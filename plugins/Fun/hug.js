import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'hug',
    description: 'Hug someone',
    category: 'Fun',
    ownerOnly: false,
    usage: 'hug @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'hug', 'hugged');
    }
};