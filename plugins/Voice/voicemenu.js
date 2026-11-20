export default {
    command: 'voicemenu',
    aliases: ['audioeffects'],
    description: 'Show all available voice effects',
    category: 'Voice',
    ownerOnly: false,
    usage: 'voicemenu',

    async execute(sock, m, args, ctx) {
        await ctx.reply(`🎙️ *Voice Effects Menu*\n\nReply to any audio message or voice note with one of these commands:\n\n• \`.bass\` - Deep bass\n• \`.deep\` - Lower pitch\n• \`.slow\` - Slowed down\n• \`.fast\` - Sped up\n• \`.nightcore\` - Nightcore style\n• \`.robot\` - Robotic voice\n• \`.reverse\` - Reversed audio\n• \`.earrape\` - Max volume\n• \`.normal\` - Normal audio`);
    }
};