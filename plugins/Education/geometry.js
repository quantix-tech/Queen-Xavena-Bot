import { getPrefix } from '../../lib/config.js';
export default {
    command: 'geometry',
    aliases: ['geo'],
    description: 'Quick geometry helper - area and perimeter for square, rectangle, circle and triangle',
    category: 'Education',
    usage: 'geometry <shape> <values>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const shape = args[0]?.toLowerCase();
        const vals = args.slice(1).map(Number);
        if (!shape) return ctx.reply(`📐 *Geometry Helper*\n\n\`${prefix}geometry square 5\`\n\`${prefix}geometry rectangle 4 6\`\n\`${prefix}geometry circle 7\`\n\`${prefix}geometry triangle 3 4 5\``);
        if (shape === 'square') {
            const s = vals[0];
            if (isNaN(s)) return ctx.reply(`❌ Usage: \`${prefix}geometry square 5\``);
            return ctx.reply(`⬛ *Square*\n\nSide: ${s}\nArea = *${s * s}*\nPerimeter = *${4 * s}*`);
        }
        if (shape === 'rectangle' || shape === 'rect') {
            const [l, w] = vals;
            if (isNaN(l) || isNaN(w)) return ctx.reply(`❌ Usage: \`${prefix}geometry rectangle 4 6\``);
            return ctx.reply(`▭ *Rectangle*\n\nLength: ${l}, Width: ${w}\nArea = *${l * w}*\nPerimeter = *${2 * (l + w)}*`);
        }
        if (shape === 'circle') {
            const r = vals[0];
            if (isNaN(r)) return ctx.reply(`❌ Usage: \`${prefix}geometry circle 7\``);
            return ctx.reply(`⭕ *Circle*\n\nRadius: ${r}\nArea = *${parseFloat((Math.PI * r * r).toFixed(4))}*\nCircumference = *${parseFloat((2 * Math.PI * r).toFixed(4))}*`);
        }
        if (shape === 'triangle') {
            const [a, b, c] = vals;
            if (isNaN(a) || isNaN(b) || isNaN(c)) return ctx.reply(`❌ Usage: \`${prefix}geometry triangle 3 4 5\``);
            const s = (a + b + c) / 2;
            const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
            return ctx.reply(`🔺 *Triangle*\n\nSides: ${a}, ${b}, ${c}\nPerimeter = *${a + b + c}*\nArea = *${parseFloat(area.toFixed(4))}*`);
        }
        return ctx.reply(`❌ Unknown shape. Try: square, rectangle, circle, triangle`);
    }
};