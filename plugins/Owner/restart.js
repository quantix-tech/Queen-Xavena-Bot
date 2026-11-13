export default {
    command: 'restart',
    description: 'Restart the bot process',
    category: 'Owner',
    ownerOnly: true,
    usage: '.restart',

    async execute(sock, m, args, ctx) {
        await ctx.reply('🔄 *Restarting Bot...*\n\nPlease wait a few seconds.');
        
        // Wait 1.5 seconds to ensure the message is actually delivered before killing the process
        setTimeout(() => {
            console.log('[restart] Process exiting for restart...');
            process.exit(0);
        }, 1500);
    }
};