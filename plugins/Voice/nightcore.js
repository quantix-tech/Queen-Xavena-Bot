import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'nightcore', description: 'Nightcore audio effect', category: 'Voice', ownerOnly: false, usage: 'nightcore (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, 'atempo=1.2,asetrate=44100*1.25'); }
};