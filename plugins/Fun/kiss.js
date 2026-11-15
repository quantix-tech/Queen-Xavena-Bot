import { sendReaction } from '../../lib/reactions.js';

export default {
    command: 'kiss',
    description: 'Kiss someone',
    category: 'Fun',
    ownerOnly: false,
    usage: 'kiss @user / reply',

    async execute(sock, m, args, ctx) {
        await sendReaction(sock, m, ctx, 'kiss', 'kissed');
    }
};