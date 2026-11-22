import { getPrefix } from '../../lib/config.js';
export default {
    command: 'conevolume',
    aliases: ['cone'],
    description: 'Calculate the volume of a cone from its radius and height using V = ⅓πr²h',
    category: 'Education',
    usage: 'conevolume <radius> <height>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [r, h] = args.map(Number);
        if (isNaN(r) || isNaN(h) || r < 0 || h < 0) return ctx.reply(`🍦 *Cone Volume*\n\nUsage: \`${prefix}conevolume 3 5\``);
        const vol = (1 / 3) * Math.PI * r * r * h;
        return ctx.reply(`🍦 *Cone Volume*\n\nRadius: ${r}\nHeight: ${h}\nFormula: ⅓πr²h\nVolume = *${parseFloat(vol.toFixed(4))}*`);
    }
};