import { getPrefix } from '../../lib/config.js';
export default {
    command: 'pythagoras',
    aliases: ['pythag', 'righttriangle'],
    description: 'Solve right triangles with Pythagoras theorem - find missing side from a² + b² = c²',
    category: 'Education',
    usage: 'pythagoras <a> <b> | pythagoras <a> ? <c>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        if (args.length < 2) return ctx.reply(`📐 *Pythagoras*\n\nUsage:\n\`${prefix}pythagoras 3 4\` - find hypotenuse\n\`${prefix}pythagoras 3 ? 5\` - find missing leg`);
        const parse = (v) => v === '?' || v.toLowerCase() === 'x' ? null : parseFloat(v);
        const a = parse(args[0]);
        const b = parse(args[1]);
        const c = args[2] ? parse(args[2]) : null;
        if (a === null && b !== null && c !== null) {
            if (c <= b) return ctx.reply(`❌ Hypotenuse must be the longest side`);
            const res = Math.sqrt(c * c - b * b);
            return ctx.reply(`📐 *Pythagoras*\n\na² + ${b}² = ${c}²\na = *${parseFloat(res.toFixed(4))}*`);
        }
        if (b === null && a !== null && c !== null) {
            if (c <= a) return ctx.reply(`❌ Hypotenuse must be the longest side`);
            const res = Math.sqrt(c * c - a * a);
            return ctx.reply(`📐 *Pythagoras*\n\n${a}² + b² = ${c}²\nb = *${parseFloat(res.toFixed(4))}*`);
        }
        if (c === null && a !== null && b !== null) {
            const res = Math.sqrt(a * a + b * b);
            return ctx.reply(`📐 *Pythagoras*\n\n${a}² + ${b}² = c²\nc = *${parseFloat(res.toFixed(4))}*`);
        }
        return ctx.reply(`❌ Use ? for the missing side. Example: \`${prefix}pythagoras 3 4\``);
    }
};