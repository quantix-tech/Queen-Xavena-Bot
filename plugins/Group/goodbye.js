import { getWelcomeConfig, setWelcomeConfig } from '../../handlers/welcome.js';
import { getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'goodbye',
    description: 'Toggle or set the goodbye message',
    category: 'Group',
    ownerOnly: false,
    usage: 'goodbye <on/off/set <text>>',

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
                config.goodbye.enabled = true;
                setWelcomeConfig(m.key.remoteJid, config);
                await ctx.reply('✅ *Goodbye Enabled*\n\nLeaving members will be bid farewell.');
             
                return;
            }

            if (action === 'off') {
                config.goodbye.enabled = false;
                setWelcomeConfig(m.key.remoteJid, config);
                await ctx.reply('❌ *Goodbye Disabled*');
           
                return;
            }

            if (action === 'set') {
                const newText = args.slice(1).join(' ');
                if (!newText) {
               
                    return ctx.reply('❌ Provide the goodbye text.\n\n*Placeholders:* {mention}, {group}');
                }
                
                config.goodbye.text = newText;
                config.goodbye.enabled = true;
                setWelcomeConfig(m.key.remoteJid, config);
                await ctx.reply(`✅ *Goodbye Updated*\n\n*Preview:*\n${newText.replace(/{mention}/g, '@User').replace(/{group}/g, metadata.subject)}`);
          
                return;
            }

            // Show status
            await ctx.reply(`👋 *Goodbye Settings*\n\n*Status:* ${config.goodbye.enabled ? '✅ ON' : '❌ OFF'}\n\n*Usage:*\n.goodbye on\n.goodbye off\n.goodbye set <text>\n\n*Placeholders:* {mention}, {group}\n\n*Current Text:*\n${config.goodbye.text}`);
            await ctx.react('✅');

        } catch (err) {
            console.error('Goodbye error:', err);
       
            await ctx.reply(`❌ Error: ${err.message}`);
        }
    }
};