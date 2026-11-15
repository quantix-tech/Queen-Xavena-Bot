import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'slap',
    description: 'Slap someone',
    category: 'Fun',
    ownerOnly: false,
    usage: 'slap @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'slap', 'slapped');
    }
};