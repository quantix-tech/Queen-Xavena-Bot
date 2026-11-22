import { getPrefix } from '../../lib/config.js';
export default {
    command: 'tempconv',
    aliases: ['temp', 'temperature'],
    description: 'Convert temperature between Celsius, Fahrenheit and Kelvin with exact formulas',
    category: 'Education',
    usage: 'tempconv <value> <from> to <to>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (!input) return ctx.reply(`🌡️ *Temp Converter*\n\nUsage: \`${prefix}tempconv 100 C to F\`\nUnits: C, F, K`);
        const p = input.toLowerCase().replace(/to/g, ' ').split(' ').filter(Boolean);
        const val = parseFloat(p[0]);
        const from = p[1];
        const to = p[2] || 'c';
        if (isNaN(val)) return ctx.reply(`❌ Invalid number`);
        const map = { c: 'c', celsius: 'c', f: 'f', fahrenheit: 'f', k: 'k', kelvin: 'k' };
        const f = map[from];
        const t = map[to];
        if (!f || !t) return ctx.reply(`❌ Use C, F or K`);
        let c = f === 'c' ? val : f === 'f' ? (val - 32) * 5 / 9 : val - 273.15;
        let res = t === 'c' ? c : t === 'f' ? c * 9 / 5 + 32 : c + 273.15;
        return ctx.reply(`🌡️ *Temperature*\n\n*${val}°${f.toUpperCase()}* = *${parseFloat(res.toFixed(4))}°${t.toUpperCase()}*`);
    }
};