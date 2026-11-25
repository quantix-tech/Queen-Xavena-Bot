export default {
    command: 'script', aliases: ['repo'], description: 'Get the bot GitHub repo', category: 'General', ownerOnly: false, usage: 'script',
    async execute(sock, m, args, ctx) {
        await ctx.reply(`🐙 *Bot Repository*\n\nPlease note: The Queen Xavena repository is not publicly disclosed. For access requests, kindly contact the developer at https://t.me/dark_heart011`);
    }
};