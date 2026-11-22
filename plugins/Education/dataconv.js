import { getPrefix } from '../../lib/config.js';
export default {
    command: 'dataconv',
    aliases: ['data'],
    description: 'Convert digital data size between bits, bytes, KB, MB, GB, TB and PB',
    category: 'Education',
    usage: 'dataconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`💾 *Data Converter*\n\nUsage: \`${prefix}dataconv 1 gb to mb\`\nUnits: bit, byte, kb, mb, gb, tb, pb`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'mb';
        const u = { bit: 0.125, bits: 0.125, byte: 1, bytes: 1, b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3, tb: 1024 ** 4, pb: 1024 ** 5 };
        if (isNaN(val) || !u[from] || !u[to]) return ctx.reply(`❌ Invalid. Try: \`${prefix}dataconv 1 gb to mb\``);
        const res = val * u[from] / u[to];
        return ctx.reply(`💾 *Data*\n\n*${val} ${from.toUpperCase()}* = *${parseFloat(res.toFixed(4))} ${to.toUpperCase()}*`);
    }
};