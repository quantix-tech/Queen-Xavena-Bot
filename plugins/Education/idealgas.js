import { getPrefix } from '../../lib/config.js';
export default {
    command: 'idealgas',
    aliases: ['gaslaw', 'pvnrt'],
    description: 'Solve the Ideal Gas Law PV = nRT for pressure, volume, moles or temperature',
    category: 'Education',
    usage: 'idealgas P <n> <T> <V> | idealgas V <n> <T> <P> | idealgas n <P> <V> <T> | idealgas T <P> <V> <n>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const find = args[0]?.toUpperCase();
        const [a, b, c] = args.slice(1).map(Number);
        const R = 0.0821;
        if (!find || isNaN(a) || isNaN(b) || isNaN(c)) return ctx.reply(`💨 *Ideal Gas Law PV = nRT*\n\n\`${prefix}idealgas P 1 273 22.4\` - Pressure (atm)\n\`${prefix}idealgas V 1 273 1\` - Volume (L)\n\`${prefix}idealgas n 1 22.4 273\` - Moles\n\`${prefix}idealgas T 1 22.4 1\` - Temp (K)\nR = 0.0821 L·atm/mol·K`);
        if (find === 'P') return ctx.reply(`💨 *Ideal Gas*\n\nP = nRT / V\nP = ${a} × 0.0821 × ${b} / ${c} = *${parseFloat((a * R * b / c).toFixed(4))} atm*`);
        if (find === 'V') return ctx.reply(`💨 *Ideal Gas*\n\nV = nRT / P\nV = ${a} × 0.0821 × ${b} / ${c} = *${parseFloat((a * R * b / c).toFixed(4))} L*`);
        if (find === 'N') return ctx.reply(`💨 *Ideal Gas*\n\nn = PV / RT\nn = ${a} × ${b} / (0.0821 × ${c}) = *${parseFloat((a * b / (R * c)).toFixed(4))} mol*`);
        if (find === 'T') return ctx.reply(`💨 *Ideal Gas*\n\nT = PV / nR\nT = ${a} × ${b} / (${c} × 0.0821) = *${parseFloat((a * b / (c * R)).toFixed(2))} K* (${parseFloat((a * b / (c * R) - 273.15).toFixed(2))}°C)`);
        return ctx.reply(`❌ Use P, V, n or T`);
    }
};