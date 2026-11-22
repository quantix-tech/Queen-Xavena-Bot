export default {
    command: 'case', aliases: ['lower', 'upper', 'titlecase'], description: 'Change text case', category: 'Tools', ownerOnly: false, usage: '<lower|upper|titlecase> <text>',
    async execute(sock, m, args, ctx) {
        const cmd = ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase();
        const text = args.join(' ');
        if (!text) return ctx.reply('❌ Provide text.');
        
        let result = '';
        if (cmd === 'lower') result = text.toLowerCase();
        else if (cmd === 'upper') result = text.toUpperCase();
        else if (cmd === 'titlecase') result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        
        await ctx.reply(result);
    }
};