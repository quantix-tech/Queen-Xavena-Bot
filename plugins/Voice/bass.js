import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'bass', description: 'Add bass boost to audio', category: 'Voice', ownerOnly: false, usage: 'bass (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'bass=g=20'); }
};