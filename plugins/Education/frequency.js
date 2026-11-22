import { getPrefix } from '../../lib/config.js';
export default {
    command: 'frequency',
    aliases: ['freq'],
    description: 'Convert between frequency, period and wavelength for waves (f = 1/T, v = fλ)',
    category: 'Education',
    usage: 'frequency <f> | frequency period <T> | frequency wave <wavelength> <speed>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args[0]?.toLowerCase() === 'period') {
            const T = parseFloat(args[1]);
            if (isNaN(T) || T === 0) return ctx.reply(`❌ Usage: \`${prefix}frequency period 0.02\``);
            return ctx.reply(`〰️ *Frequency*\n\nf = 1 / T\nf = 1 / ${T} = *${parseFloat((1 / T).toFixed(4))} Hz*`);
        }
        if (args[0]?.toLowerCase() === 'wave') {
            const [lambda, v] = args.slice(1).map(Number);
            if (isNaN(lambda) || isNaN(v) || lambda === 0) return ctx.reply(`❌ Usage: \`${prefix}frequency wave 2 340\``);
            return ctx.reply(`〰️ *Wave Frequency*\n\nf = v / λ\nf = ${v} / ${lambda} = *${parseFloat((v / lambda).toFixed(4))} Hz*`);
        }
        const f = parseFloat(args[0]);
        if (isNaN(f) || f === 0) return ctx.reply(`〰️ *Frequency*\n\nUsage: \`${prefix}frequency 50\`\nUsage: \`${prefix}frequency period 0.02\`\nUsage: \`${prefix}frequency wave 2 340\``);
        return ctx.reply(`〰️ *Frequency*\n\nFrequency: ${f} Hz\nPeriod = *${parseFloat((1 / f).toFixed(6))} s*\nAngular frequency = *${parseFloat((2 * Math.PI * f).toFixed(4))} rad/s*`);
    }
};