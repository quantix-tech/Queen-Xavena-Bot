import { getBotName } from '../../lib/config.js';
export default {
    command: 'about', description: 'About the bot', category: 'General', ownerOnly: false, usage: 'about',
    async execute(sock, m, args, ctx) {
        await ctx.reply(`🤖 *About ${getBotName()}*\n\nA highly advanced WhatsApp bot built on Baileys, powered by *『𖤍 x ʟᴀʙs 𖤍』*, with premium features.\n\n👑 *Owner:* Lord Xaven\n🌍 *Version:* 1.0.0`);
    }
};