import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'fast', description: 'Speed up audio', category: 'Voice', ownerOnly: false, usage: 'fast (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'atempo=1.5'); }
};