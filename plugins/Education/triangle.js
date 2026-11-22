import { getPrefix } from '../../lib/config.js';
export default {
    command: 'triangle',
    description: 'Calculate triangle area, perimeter and type from its three sides or base and height',
    category: 'Education',
    usage: 'triangle <a> <b> <c> | triangle base <base> height <height>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');
        if (input.includes('base')) {
            const base = parseFloat(input.match(/base\s*([\d.]+)/)?.[1]);
            const height = parseFloat(input.match(/height\s*([\d.]+)/)?.[1]);
            if (isNaN(base) || isNaN(height)) return ctx.reply(`❌ Usage: \`${prefix}triangle base 10 height 5\``);
            const area = 0.5 * base * height;
            return ctx.reply(`🔺 *Triangle*\n\nBase: ${base}\nHeight: ${height}\nArea = ½ × base × height = *${parseFloat(area.toFixed(4))}*`);
        }
        const [a, b, c] = args.map(Number);
        if (isNaN(a) || isNaN(b) || isNaN(c)) return ctx.reply(`🔺 *Triangle*\n\nUsage: \`${prefix}triangle 3 4 5\` (3 sides)\nUsage: \`${prefix}triangle base 10 height 5\``);
        if (a + b <= c || a + c <= b || b + c <= a) return ctx.reply(`❌ These sides cannot form a triangle`);
        const perimeter = a + b + c;
        const s = perimeter / 2;
        const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
        let type = 'Scalene';
        if (a === b && b === c) type = 'Equilateral';
        else if (a === b || b === c || a === c) type = 'Isosceles';
        return ctx.reply(`🔺 *Triangle*\n\nSides: ${a}, ${b}, ${c}\nType: *${type}*\nPerimeter = *${parseFloat(perimeter.toFixed(4))}*\nArea = *${parseFloat(area.toFixed(4))}*`);
    }
};