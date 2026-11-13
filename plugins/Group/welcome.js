import { getWelcomeConfig, setWelcomeConfig } from '../../handlers/welcome.js';
import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'welcome',
    description: 'Toggle or set the welcome message',
    category: 'Group',
    ownerOnly: false,
    usage: 'welcome <on/off/set <text>>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

      

        try {
            const metadata = await getGroupMetadata(sock, m.key.remoteJid);
            const sender = metadata.participants.find(p => p.id === m.key.participant);
            
            if (sender?.admin !== 'admin' && sender?.admin !== 'superadmin') {
               
                return ctx.reply('❌ Only group admins can use this command.');
            }

            const config = getWelcomeConfig(m.key.remoteJid);
            const action = args[0]?.toLowerCase();

            if (action === 'on') {
                config.welcome.enabled = true;
                setWelcomeConfig(m.key.remoteJid, config);
                await ctx.reply('✅ *Welcome Enabled*\n\nNew members will be greeted.');
             
                return;
            }

            if (action === 'off') {
                config.welcome.enabled = false;
                setWelcomeConfig(m.key.remoteJid, config);
                await ctx.reply('❌ *Welcome Disabled*');
              
                return;
            }

            if (action === 'set') {
                const newText = args.slice(1).join(' ');
                if (!newText) {
                
                    return ctx.reply('❌ Provide the welcome text.\n\n*Placeholders:* {mention}, {group}, {count}');
                }
                
                config.welcome.text = newText;
                config.welcome.enabled = true;
                setWelcomeConfig(m.key.remoteJid, config);
                await ctx.reply(`✅ *Welcome Updated*\n\n*Preview:*\n${newText.replace(/{mention}/g, '@User').replace(/{group}/g, metadata.subject).replace(/{count}/g, metadata.participants.length + 1)}`);
               
                return;
            }

            // Show status
            await ctx.reply(`👋 *Welcome Settings*\n\n*Status:* ${config.welcome.enabled ? '✅ ON' : '❌ OFF'}\n\n*Usage:*\n.welcome on\n.welcome off\n.welcome set <text>\n\n*Placeholders:* {mention}, {group}, {count}\n\n*Current Text:*\n${config.welcome.text}`);
        

        } catch (err) {
            console.error('Welcome error:', err);
         
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};