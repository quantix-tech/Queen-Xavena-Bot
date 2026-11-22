export default {
    command: 'choose', description: 'Pick a random option', category: 'General', ownerOnly: false, usage: 'choose <opt1>, <opt2>',
    async execute(sock, m, args, ctx) {
        const text = args.join(' ');
        const options = text.split(/[,|]/).map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return ctx.reply('❌ Provide at least 2 options separated by comma or `|`.');
        const pick = options[Math.floor(Math.random() * options.length)];
        await ctx.reply(`🤔 *I choose:* ${pick}`);
    }
};