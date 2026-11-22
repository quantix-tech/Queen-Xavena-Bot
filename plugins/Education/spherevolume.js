import { getPrefix } from '../../lib/config.js';
export default {
    command: 'spherevolume',
    aliases: ['sphere'],
    description: 'Calculate the volume and surface area of a sphere from its radius',
    category: 'Education',
    usage: 'spherevolume <radius>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const r = parseFloat(args[0]);
        if (isNaN(r) || r < 0) return ctx.reply(`⚽ *Sphere Volume*\n\nUsage: \`${prefix}spherevolume 5\``);
        const vol = (4 / 3) * Math.PI * r * r * r;
        const surface = 4 * Math.PI * r * r;
        return ctx.reply(`⚽ *Sphere*\n\nRadius: ${r}\nVolume = ⁴⁄₃πr³ = *${parseFloat(vol.toFixed(4))}*\nSurface Area = 4πr² = *${parseFloat(surface.toFixed(4))}*`);
    }
};