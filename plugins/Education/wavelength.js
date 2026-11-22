import { getPrefix } from '../../lib/config.js';
export default {
    command: 'wavelength',
    aliases: ['lambda'],
    description: 'Calculate wavelength from frequency and wave speed using λ = v / f',
    category: 'Education',
    usage: 'wavelength <frequency> [speed]',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const f = parseFloat(args[0]);
        const v = parseFloat(args[1]) || 299792458;
        if (isNaN(f) || f === 0) return ctx.reply(`🌊 *Wavelength*\n\nUsage: \`${prefix}wavelength 50\` (light)\nUsage: \`${prefix}wavelength 440 343\` (sound in air)`);
        const lambda = v / f;
        return ctx.reply(`🌊 *Wavelength*\n\nλ = v / f\nλ = ${v} / ${f} = *${parseFloat(lambda.toFixed(6))} m*\nSpeed used: ${v} m/s`);
    }
};