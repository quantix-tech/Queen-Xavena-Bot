export default {
    command: 'ratethis',
    description: 'Rate something from 1 to 10',
    category: 'General',
    ownerOnly: false,
    usage: 'ratethis <thing>',

    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        if (!text) return ctx.reply('❌ Provide something to rate.\nExample: `.ratethis my cooking`');

        const score = Math.floor(Math.random() * 10) + 1;
        let verdict = '';
        
        if (score >= 9) verdict = '🔥 Absolute masterpiece!';
        else if (score >= 7) verdict = '✨ Pretty good!';
        else if (score >= 5) verdict = '😐 It\'s aight.';
        else if (score >= 3) verdict = '📉 Needs work.';
        else verdict = '💀 Trash.';

        await ctx.reply(`📊 *Rating: ${text}*\n\n*Score:* ${score}/10\n*Verdict:* ${verdict}`);
    }
};