import { getPrefix } from '../../lib/config.js';
export default {
    command: 'gravforce',
    aliases: ['gravity'],
    description: 'Calculate gravitational force between two masses using Newton\'s law of gravitation',
    category: 'Education',
    usage: 'gravforce <m1> <m2> <distance>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [m1, m2, r] = args.map(Number);
        if (isNaN(m1) || isNaN(m2) || isNaN(r) || r === 0) return ctx.reply(`🌍 *Gravitational Force*\n\nUsage: \`${prefix}gravforce 1000 1000 10\`\nFormula: F = G·m1·m2 / r²`);
        const G = 6.674e-11;
        const F = G * m1 * m2 / (r * r);
        return ctx.reply(`🌍 *Gravitational Force*\n\nF = G·m1·m2 / r²\nF = *${F.toExponential(4)} N*\nG = 6.674 × 10⁻¹¹ N·m²/kg²`);
    }
};