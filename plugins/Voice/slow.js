import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'slow', description: 'Slow down audio', category: 'Voice', ownerOnly: false, usage: 'slow (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'atempo=0.8'); }
};