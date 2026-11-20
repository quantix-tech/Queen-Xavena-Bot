import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'normal', description: 'Reset audio to normal', category: 'Voice', ownerOnly: false, usage: 'normal (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'anull'); }
};