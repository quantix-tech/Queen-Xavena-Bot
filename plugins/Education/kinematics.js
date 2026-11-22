import { getPrefix } from '../../lib/config.js';
export default {
    command: 'kinematics',
    aliases: ['motion'],
    description: 'Solve motion equations - final velocity, distance and time with constant acceleration',
    category: 'Education',
    usage: 'kinematics v <u> <a> <t> | kinematics s <u> <a> <t>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const find = args[0]?.toLowerCase();
        const [u, a, t] = args.slice(1).map(Number);
        if (!find || isNaN(u) || isNaN(a) || isNaN(t)) return ctx.reply(`🏃 *Kinematics*\n\n\`${prefix}kinematics v 0 10 5\` - final velocity\n\`${prefix}kinematics s 0 10 5\` - distance\nFormulas: v = u + at, s = ut + ½at²`);
        if (find === 'v') {
            const v = u + a * t;
            return ctx.reply(`🏃 *Kinematics*\n\nv = u + at\nv = ${u} + ${a} × ${t} = *${parseFloat(v.toFixed(4))} m/s*`);
        }
        if (find === 's') {
            const s = u * t + 0.5 * a * t * t;
            return ctx.reply(`🏃 *Kinematics*\n\ns = ut + ½at²\ns = ${u} × ${t} + ½ × ${a} × ${t}² = *${parseFloat(s.toFixed(4))} m*`);
        }
        return ctx.reply(`❌ Use v or s. Example: \`${prefix}kinematics v 0 10 5\``);
    }
};