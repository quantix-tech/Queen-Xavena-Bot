import { getPrefix } from '../../lib/config.js';
export default {
    command: 'torquecalc',
    aliases: ['torque'],
    description: 'Calculate torque τ = r × F × sin(θ) from lever arm, force and angle',
    category: 'Education',
    usage: 'torquecalc <force> <distance> [angle]',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const F = parseFloat(args[0]);
        const r = parseFloat(args[1]);
        const angle = parseFloat(args[2]) || 90;
        if (isNaN(F) || isNaN(r)) return ctx.reply(`🔧 *Torque*\n\nUsage: \`${prefix}torquecalc 100 0.5\`\nUsage: \`${prefix}torquecalc 100 0.5 30\``);
        const rad = angle * Math.PI / 180;
        const torque = r * F * Math.sin(rad);
        return ctx.reply(`🔧 *Torque*\n\nτ = r × F × sin(θ)\nτ = ${r} × ${F} × sin(${angle}°) = *${parseFloat(torque.toFixed(4))} N·m*`);
    }
};