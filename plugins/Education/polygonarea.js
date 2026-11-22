import { getPrefix } from '../../lib/config.js';
export default {
    command: 'polygonarea',
    aliases: ['polygon'],
    description: 'Calculate the area of a regular polygon from number of sides and side length',
    category: 'Education',
    usage: 'polygonarea <sides> <sideLength>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const n = parseInt(args[0]);
        const s = parseFloat(args[1]);
        if (isNaN(n) || isNaN(s) || n < 3) return ctx.reply(`📐 *Polygon Area*\n\nUsage: \`${prefix}polygonarea 6 5\`\nFor a regular hexagon with side 5`);
        const area = (n * s * s) / (4 * Math.tan(Math.PI / n));
        const names = { 3: 'Triangle', 4: 'Square', 5: 'Pentagon', 6: 'Hexagon', 7: 'Heptagon', 8: 'Octagon' };
        return ctx.reply(`📐 *Regular Polygon Area*\n\nShape: *${names[n] || `${n}-sided polygon`}*\nSides: ${n}\nSide length: ${s}\nArea = *${parseFloat(area.toFixed(4))}*`);
    }
};