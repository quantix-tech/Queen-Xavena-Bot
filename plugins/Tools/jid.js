import { getPrefix } from '../../lib/config.js';
import { getRealJid, extractRawId } from '../../lib/utils.js';

export default {
    command: 'jid',
    aliases: ['getjid', 'lid', 'getlid'],
    description: 'Get the JID, LID, and phone number of a user or group',
    category: 'Tools',
    ownerOnly: false,
    usage: 'jid OR jid @user OR jid group',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        
        // 1. Check if they want the Group JID
        if (args[0]?.toLowerCase() === 'group') {
            if (!m.key.remoteJid.endsWith('@g.us')) {
                return ctx.reply('❌ This is not a group chat.');
            }
            return ctx.reply(`👥 *Group JID*\n\n\`${m.key.remoteJid}\``);
        }

        // 2. Determine the target
        let targetJid = null;
        
        if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted) {
            targetJid = ctx.quoted.sender || ctx.quoted.key.participant;
        } else if (args[0]) {
            // If they typed a number
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
            // Default to the sender
            targetJid = m.key.participant || m.key.remoteJid;
        }

        try {
            // 3. Resolve the phone number
            const realNumber = await getRealJid(targetJid, sock);
            const rawJid = targetJid;
            const rawDigits = extractRawId(targetJid);

            // 4. Check if the number exists on WhatsApp and get Push Name
            let pushName = 'Unknown';
            let isRegistered = false;
            
            try {
                const waInfo = await sock.onWhatsApp(rawDigits + '@s.whatsapp.net');
                if (waInfo && waInfo.length > 0 && waInfo[0].exists) {
                    isRegistered = true;
                    if (waInfo[0].name) pushName = waInfo[0].name;
                }
            } catch (e) {}

            // Try to get push name from group metadata if it's a group
            if (m.key.remoteJid.endsWith('@g.us') && !isRegistered) {
                try {
                    const metadata = await sock.groupMetadata(m.key.remoteJid);
                    const participant = metadata.participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
                    if (participant?.notify) pushName = participant.notify;
                } catch (e) {}
            }

            const text = `🆔 *Identity Info*\n\n` +
                         `👤 *Name:* ${pushName}\n` +
                         `🔢 *Number:* +${realNumber}\n` +
                         `📱 *JID:* ${rawJid}\n` +
                         `🆔 *Raw ID:* ${rawDigits}\n` +
                         `✅ *Registered:* ${isRegistered ? 'Yes' : 'Unknown'}`;

            await ctx.reply(text);

        } catch (err) {
            console.error('JID error:', err);
            await ctx.reply(`❌ *Error*\n\nCould not fetch identity info.\n_Error: ${err.message}_`);
        }
    }
};