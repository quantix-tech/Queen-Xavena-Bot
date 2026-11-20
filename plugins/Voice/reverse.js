import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'reverse', description: 'Reverse audio', category: 'Voice', ownerOnly: false, usage: 'reverse (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'areverse'); }
};