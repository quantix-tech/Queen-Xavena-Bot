import { getPrefix } from '../../lib/config.js';
import { getGroupedPlugins } from '../../lib/loader.js';

export default {
    command: 'menu2',
    aliases: ['menurich', 'help2'],
    description: 'Show bot menu with rich response',
    category: 'Tools',
    ownerOnly: false,
    usage: 'menu2',

    async execute(sock, m, args, ctx) {
        const start = Date.now();

        try {
            const prefix = getPrefix();
            const grouped = getGroupedPlugins(ctx.pluginMap);

            // Build table of REAL commands - not ping stats
            const table = [{
                isHeading: true,
                items: ['', 'Command', 'Category']
            }];

            for (const [cat, plugins] of grouped.entries()) {
                for (const p of plugins) {
                    table.push({
                        isHeading: false,
                        items: [`${prefix}${p.command}`, cat.toUpperCase(), p.description ? p.description.slice(0, 30) : 'No description']
                    });
                }
            }

            await sock.sendMessage(m.key.remoteJid, {
                disclaimerText: 'Bot Menu • Rich Response',
                richResponse: [{
                    text: '📋 *Menu!* Here are my commands',
                }, {
                    language: 'javascript',
                    code: [{
                        highlightType: 0,
                        codeContent: `// menu list\nconst prefix = "${prefix}";\nconst total = ${ctx.pluginMap.size};\nconsole.log("Menu! " + total + " commands");`
                    }]
                }, {
                    text: 'Here is the full command list:\n'
                }, {
                    title: 'Bot Menu',
                    table: table
                }, {
                    text: `Total: ${ctx.pluginMap.size} commands\nUse *${prefix}<command>* to run one. ✨`
                }]
            });
        } catch (e) {
            console.error('Menu2 error:', e);
            await ctx.reply(`📋 *Menu*\n\n*Speed:* ${Date.now() - start}ms`);
        }
    }
};