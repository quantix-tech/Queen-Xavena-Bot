import { getPrefix } from '../../lib/config.js';
export default {
    command: 'ohmslaw',
    aliases: ['ohm'],
    description: 'Solve Ohm\'s Law V = IR - find voltage, current or resistance in a circuit',
    category: 'Education',
    usage: 'ohmslaw V <I> <R> | ohmslaw I <V> <R> | ohmslaw R <V> <I>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const find = args[0]?.toUpperCase();
        const [a, b] = args.slice(1).map(Number);
        if (!find || isNaN(a) || isNaN(b)) return ctx.reply(`⚡ *Ohm's Law*\n\n\`${prefix}ohmslaw V 2 10\` - find Voltage\n\`${prefix}ohmslaw I 20 10\` - find Current\n\`${prefix}ohmslaw R 20 2\` - find Resistance`);
        if (find === 'V') return ctx.reply(`⚡ *Ohm's Law*\n\nV = I × R\nV = ${a} × ${b} = *${a * b} V*`);
        if (find === 'I') { if (b === 0) return ctx.reply(`❌ Resistance cannot be 0`); return ctx.reply(`⚡ *Ohm's Law*\n\nI = V / R\nI = ${a} / ${b} = *${parseFloat((a / b).toFixed(4))} A*`); }
        if (find === 'R') { if (b === 0) return ctx.reply(`❌ Current cannot be 0`); return ctx.reply(`⚡ *Ohm's Law*\n\nR = V / I\nR = ${a} / ${b} = *${parseFloat((a / b).toFixed(4))} Ω*`); }
        return ctx.reply(`❌ Use V, I or R. Example: \`${prefix}ohmslaw V 2 10\``);
    }
};