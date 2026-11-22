import { getPrefix } from '../../lib/config.js';
export default {
    command: 'waves',
    description: 'Solve the wave equation v = fλ - find speed, frequency or wavelength',
    category: 'Education',
    usage: 'waves v <f> <lambda> | waves f <v> <lambda> | waves lambda <v> <f>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const find = args[0]?.toLowerCase();
        const [a, b] = args.slice(1).map(Number);
        if (!find || isNaN(a) || isNaN(b)) return ctx.reply(`🌊 *Wave Equation*\n\n\`${prefix}waves v 50 2\` - find speed\n\`${prefix}waves f 340 2\` - find frequency\n\`${prefix}waves lambda 340 50\` - find wavelength`);
        if (find === 'v') return ctx.reply(`🌊 *Wave Speed*\n\nv = f × λ\nv = ${a} × ${b} = *${a * b} m/s*`);
        if (find === 'f') { if (b === 0) return ctx.reply(`❌ Wavelength cannot be 0`); return ctx.reply(`🌊 *Frequency*\n\nf = v / λ\nf = ${a} / ${b} = *${parseFloat((a / b).toFixed(4))} Hz*`); }
        if (find === 'lambda') { if (b === 0) return ctx.reply(`❌ Frequency cannot be 0`); return ctx.reply(`🌊 *Wavelength*\n\nλ = v / f\nλ = ${a} / ${b} = *${parseFloat((a / b).toFixed(4))} m*`); }
        return ctx.reply(`❌ Use v, f or lambda`);
    }
};