export default {
    command: 'device', description: 'Check what device a message was sent from', category: 'General', ownerOnly: false, usage: 'device (reply)',
    async execute(sock, m, args, ctx) {
        if (!ctx.quoted) return ctx.reply('❌ Reply to a message to check its device info.');
        const device = ctx.quoted.raw?.device || 'Unknown';
        await ctx.reply(`📱 *Device Info*\n\n*Device:* ${device}`);
    }
};