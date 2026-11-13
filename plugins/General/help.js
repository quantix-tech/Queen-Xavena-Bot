import { getPrefix, getBotName } from '../../lib/config.js';

export default {
    command: 'help',
    description: 'Get info on how to use a command',
    category: 'General',
    ownerOnly: false,
    usage: 'help <command>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        
        if (!args[0]) {
            return ctx.reply(`❓ *Help Menu*\n\n*Usage:* ${prefix}help <command>\n*Example:* ${prefix}help menu`);
        }

        const cmdName = args[0].toLowerCase().replace(prefix, '');
        const plugin = ctx.pluginMap.get(cmdName);

        if (!plugin) {
            return ctx.reply(`❌ Command "*${cmdName}*" not found.`);
        }

        let text = `📖 *Command Info*\n\n`;
        text += `├◆ *Name* : ${plugin.command}\n`;
        text += `├◆ *Category* : ${plugin.category}\n`;
        text += `├◆ *Description* : ${plugin.description || 'No description provided'}\n`;
        
        if (plugin.usage) {
            // Prepend the current prefix to the usage string
            text += `├◆ *Usage* : ${prefix}${plugin.usage}\n`;
        }
        
        if (plugin.ownerOnly) {
            text += `├◆ *Restriction* : Owner Only\n`;
        }

        await ctx.reply(text);
    }
};