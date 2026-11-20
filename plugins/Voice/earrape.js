import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'earrape', description: 'Max volume audio', category: 'Voice', ownerOnly: false, usage: 'earrape (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'volume=12'); }
};