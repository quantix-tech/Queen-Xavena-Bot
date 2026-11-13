import { getMenuImage, setMenuImage, getPrefix } from '../../lib/config.js';

export default {
    command: 'setmenuimg',
    description: 'Change the menu image URL',
    category: 'Owner',
    ownerOnly: true,
    usage: '.setmenuimg <image_url>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const currentImg = getMenuImage();

        if (!args[0]) {
            return ctx.reply(`🖼️ *Set Menu Image*\n\nCurrent URL:\n${currentImg}\n\nUsage: \`${prefix}setmenuimg <image_url>\`\nExample: \`${prefix}setmenuimg https://i.imgur.com/example.jpg\``);
        }

        const newUrl = args[0];

        // Basic validation to check if it's a URL
        if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
            return ctx.reply(`❌ *Error*\n\nPlease provide a valid image URL starting with http:// or https://`);
        }

        if (newUrl === currentImg) {
            return ctx.reply(`ℹ️ The menu image is already set to this URL.`);
        }

        // Save to config
        setMenuImage(newUrl);

        // Send a preview to confirm
        try {
            await sock.sendMessage(m.chat, {
                image: { url: newUrl },
                caption: `✅ *Menu Image Updated!*\n\nThis is how it will look from now on.\n\nNote: If this image fails to load, it will automatically fall back to text.`
            }, { quoted: m });
        } catch (err) {
            return ctx.reply(`✅ *Menu Image URL Updated*\n\nAll menu will now use the image.`);
        }
    }
};