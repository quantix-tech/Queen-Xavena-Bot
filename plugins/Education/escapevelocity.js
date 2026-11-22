import { getPrefix } from '../../lib/config.js';
export default {
    command: 'escapevelocity',
    aliases: ['escape'],
    description: 'Calculate escape velocity needed to leave a planet using v = √(2GM/r)',
    category: 'Education',
    usage: 'escapevelocity <mass> <radius> | escapevelocity earth | escapevelocity moon',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const G = 6.674e-11;
        let M, r, name = 'Custom';
        if (args[0]?.toLowerCase() === 'earth') { M = 5.972e24; r = 6371000; name = 'Earth'; }
        else if (args[0]?.toLowerCase() === 'moon') { M = 7.342e22; r = 1737000; name = 'Moon'; }
        else if (args[0]?.toLowerCase() === 'mars') { M = 6.417e23; r = 3389500; name = 'Mars'; }
        else { M = parseFloat(args[0]); r = parseFloat(args[1]); }
        if (isNaN(M) || isNaN(r) || r === 0) return ctx.reply(`🚀 *Escape Velocity*\n\nUsage: \`${prefix}escapevelocity earth\`\nUsage: \`${prefix}escapevelocity 5.972e24 6371000\``);
        const v = Math.sqrt(2 * G * M / r);
        return ctx.reply(`🚀 *Escape Velocity - ${name}*\n\nv = √(2GM/r)\nv = *${parseFloat((v / 1000).toFixed(2))} km/s* (${parseFloat(v.toFixed(0))} m/s)`);
    }
};