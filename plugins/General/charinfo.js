export default {
    command: 'charinfo', description: 'Get info about a character', category: 'General', ownerOnly: false, usage: 'charinfo <char>',
    async execute(sock, m, args, ctx) {
        const char = args[0];
        if (!char) return ctx.reply('❌ Provide a character. Example: `.charinfo A`');
        await ctx.reply(`🔤 *Character Info*\n\n*Char:* ${char}\n*Unicode:* U+${char.codePointAt(0).toString(16).toUpperCase()}\n*Length:* 1`);
    }
};