import { applyAudioEffect } from '../../lib/audio.js';
export default {
    command: 'robot', description: 'Robotic audio effect', category: 'Voice', ownerOnly: false, usage: 'robot (reply to audio)',
    async execute(sock, m, args, ctx) { await applyAudioEffect(sock, m, ctx, "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75"); }
};