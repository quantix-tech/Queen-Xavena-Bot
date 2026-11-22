import { getPrefix } from '../../lib/config.js';
export default {
    command: 'cylindervolume',
    aliases: ['cylinder'],
    description: 'Calculate the volume of a cylinder from its radius and height using V = πr²h',
    category: 'Education',
    usage: 'cylindervolume <radius> <height>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const [r, h] = args.map(Number);
        if (isNaN(r) || isNaN(h) || r < 0 || h < 0) return ctx.reply(`🥫 *Cylinder Volume*\n\nUsage: \`${prefix}cylindervolume 3 5\``);
        const vol = Math.PI * r * r * h;
        const surface = 2 * Math.PI * r * (r + h);
        return ctx.reply(`🥫 *Cylinder Volume*\n\nRadius: ${r}\nHeight: ${h}\nFormula: πr²h\nVolume = *${parseFloat(vol.toFixed(4))}*\nSurface Area = *${parseFloat(surface.toFixed(4))}*`);
    }
};