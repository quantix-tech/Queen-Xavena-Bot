import { getPrefix } from '../../lib/config.js';
export default {
    command: 'workdone',
    aliases: ['work'],
    description: 'Calculate work done W = F × d × cos(θ) from force, distance and angle',
    category: 'Education',
    usage: 'workdone <force> <distance> [angle]',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const F = parseFloat(args[0]);
        const d = parseFloat(args[1]);
        const angle = parseFloat(args[2]) || 0;
        if (isNaN(F) || isNaN(d)) return ctx.reply(`🔨 *Work Done*\n\nUsage: \`${prefix}workdone 50 10\`\nUsage: \`${prefix}workdone 50 10 30\` (with angle)`);
        const rad = angle * Math.PI / 180;
        const W = F * d * Math.cos(rad);
        return ctx.reply(`🔨 *Work Done*\n\nW = F × d × cos(θ)\nW = ${F} × ${d} × cos(${angle}°) = *${parseFloat(W.toFixed(4))} J*`);
    }
};