import { getPrefix } from '../../lib/config.js';
export default {
    command: 'timeconv',
    aliases: ['time'],
    description: 'Convert time between milliseconds, seconds, minutes, hours, days, weeks and years',
    category: 'Education',
    usage: 'timeconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`⏰ *Time Converter*\n\nUsage: \`${prefix}timeconv 2 hr to min\`\nUnits: ms, s, min, hr, day, week, month, year`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 's';
        const u = { ms: 0.001, s: 1, sec: 1, min: 60, hr: 3600, hour: 3600, day: 86400, week: 604800, month: 2629746, year: 31556952 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}timeconv 2 hr to min\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`⏰ *Time*\n\n*${val} ${from}* = *${parseFloat(res.toFixed(4))} ${to}*`);
    }
};