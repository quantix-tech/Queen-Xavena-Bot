import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'deep', description: 'Deep voice effect', category: 'Voice', ownerOnly: false, usage: 'deep (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'atempo=0.8,asetrate=44100*0.8'); }
};