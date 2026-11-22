export default {
    command: 'script', aliases: ['repo'], description: 'Get the bot GitHub repo', category: 'General', ownerOnly: false, usage: 'script',
    async execute(sock, m, args, ctx) {
        await ctx.reply(`🐙 *Bot Repository*\n\nYou can view, fork, or deploy the bot from:\n\nhttps://github.com/Quantix-tech/Queen-Xavena-Bot`);
    }
};