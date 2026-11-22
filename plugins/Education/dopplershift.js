import { getPrefix } from '../../lib/config.js';
export default {
    command: 'dopplershift',
    aliases: ['doppler'],
    description: 'Calculate Doppler shift - apparent frequency when source or observer is moving',
    category: 'Education',
    usage: 'dopplershift <f> <vSource> <vObserver> [speedOfSound]',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const f = parseFloat(args[0]);
        const vs = parseFloat(args[1]) || 0;
        const vo = parseFloat(args[2]) || 0;
        const v = parseFloat(args[3]) || 343;
        if (isNaN(f)) return ctx.reply(`🔊 *Doppler Shift*\n\nUsage: \`${prefix}dopplershift 500 20 0\`\n f=source freq, vs=source speed towards observer, vo=observer speed towards source`);
        const fPrime = f * (v + vo) / (v - vs);
        return ctx.reply(`🔊 *Doppler Shift*\n\nOriginal: ${f} Hz\nSource speed: ${vs} m/s\nObserver speed: ${vo} m/s\nApparent frequency = *${parseFloat(fPrime.toFixed(2))} Hz*\nShift = *${parseFloat((fPrime - f).toFixed(2))} Hz*`);
    }
};