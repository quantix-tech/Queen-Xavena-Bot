import { getPrefix } from '../../lib/config.js';
export default {
    command: 'physicsformula',
    aliases: ['physics'],
    description: 'Quick reference list of common physics formulas for exams and homework',
    category: 'Education',
    usage: 'physicsformula [topic]',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const topic = args[0]?.toLowerCase() || 'all';
        const formulas = {
            mechanics: `*Mechanics*\n• F = ma\n• v = u + at\n• s = ut + ½at²\n• v² = u² + 2as\n• p = mv\n• KE = ½mv²\n• PE = mgh\n• W = Fd cosθ`,
            electricity: `*Electricity*\n• V = IR\n• P = VI = I²R = V²/R\n• R series = R1 + R2\n• 1/R parallel = 1/R1 + 1/R2\n• Q = It\n• E = V/d`,
            waves: `*Waves*\n• v = fλ\n• T = 1/f\n• f' = f(v+vo)/(v-vs)\n• v = √(T/μ)`,
            all: `*Physics Formulas*\n\nType: \`${prefix}physicsformula mechanics\`\nType: \`${prefix}physicsformula electricity\`\nType: \`${prefix}physicsformula waves\`\n\n*Mechanics:* F=ma, v=u+at, KE=½mv²\n*Electricity:* V=IR, P=VI\n*Waves:* v=fλ, T=1/f`
        };
        return ctx.reply(`📚 ${formulas[topic] || formulas.all}`);
    }
};