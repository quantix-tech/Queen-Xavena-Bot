import { getPrefix } from '../../lib/config.js';
export default {
    command: 'lawofcosines',
    aliases: ['cosinelaw'],
    description: 'Solve a triangle side or angle using the Law of Cosines (c² = a² + b² - 2ab·cos C)',
    category: 'Education',
    usage: 'lawofcosines side <a> <b> <angleC> | lawofcosines angle <a> <b> <c>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const mode = args[0]?.toLowerCase();
        if (mode === 'side') {
            const [a, b, angleC] = args.slice(1).map(Number);
            if (isNaN(a) || isNaN(b) || isNaN(angleC)) return ctx.reply(`📐 *Law of Cosines*\n\nFind side: \`${prefix}lawofcosines side 5 7 60\`\nFind angle: \`${prefix}lawofcosines angle 5 7 8\``);
            const rad = angleC * Math.PI / 180;
            const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad));
            return ctx.reply(`📐 *Law of Cosines*\n\nSides: a=${a}, b=${b}, angle C=${angleC}°\nFormula: c² = a² + b² - 2ab·cos(C)\nc = *${parseFloat(c.toFixed(4))}*`);
        }
        if (mode === 'angle') {
            const [a, b, c] = args.slice(1).map(Number);
            if (isNaN(a) || isNaN(b) || isNaN(c)) return ctx.reply(`📐 *Law of Cosines*\n\nFind side: \`${prefix}lawofcosines side 5 7 60\`\nFind angle: \`${prefix}lawofcosines angle 5 7 8\``);
            const cosC = (a * a + b * b - c * c) / (2 * a * b);
            if (cosC < -1 || cosC > 1) return ctx.reply(`❌ Invalid triangle sides`);
            const angle = Math.acos(cosC) * 180 / Math.PI;
            return ctx.reply(`📐 *Law of Cosines*\n\nSides: a=${a}, b=${b}, c=${c}\nAngle C = *${parseFloat(angle.toFixed(4))}°*`);
        }
        return ctx.reply(`📐 *Law of Cosines*\n\nFind side: \`${prefix}lawofcosines side 5 7 60\`\nFind angle: \`${prefix}lawofcosines angle 5 7 8\``);
    }
};