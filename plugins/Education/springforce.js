import { getPrefix } from '../../lib/config.js';
export default {
    command: 'springforce',
    aliases: ['hooke'],
    description: 'Calculate spring force and potential energy using Hooke\'s Law F = -kx',
    category: 'Education',
    usage: 'springforce <k> <x>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [k, x] = args.map(Number);
        if (isNaN(k) || isNaN(x)) return ctx.reply(`🌀 *Spring Force*\n\nUsage: \`${prefix}springforce 100 0.5\`\nFormula: F = -kx, PE = ½kx²`);
        const F = -k * x;
        const PE = 0.5 * k * x * x;
        return ctx.reply(`🌀 *Spring Force (Hooke's Law)*\n\nSpring constant: ${k} N/m\nDisplacement: ${x} m\nForce = *${parseFloat(F.toFixed(4))} N*\nPotential Energy = *${parseFloat(PE.toFixed(4))} J*`);
    }
};