import { getPrefix } from '../../lib/config.js';
import { getRealJid, getGroupMetadata } from '../../lib/utils.js';

export default {
    command: 'getpp',
    aliases: ['pp', 'profilepic', 'avatar'],
    description: 'Get the profile picture of a user or group',
    category: 'Tools',
    ownerOnly: false,
    usage: 'getpp OR getpp @user OR getpp group',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const isGroupChat = m.key.remoteJid.endsWith('@g.us');
        
        let targetJid = null;
        let targetName = 'Unknown';
        let isGroupTarget = false;

        // ─── 1. DETERMINE TARGET ───
        if (args[0]?.toLowerCase() === 'group' || args[0]?.toLowerCase() === 'gc') {
            if (!isGroupChat) return ctx.reply('❌ You can only get the group profile picture inside a group.');
            targetJid = m.key.remoteJid;
            isGroupTarget = true;
        } else if (m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            targetJid = m.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (ctx.quoted) {
            targetJid = ctx.quoted.sender || ctx.quoted.key.participant;
        } else if (args[0]) {
            targetJid = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        } else {
            // Default to sender
            targetJid = m.key.participant || m.key.remoteJid;
        }

        if (!targetJid) return ctx.reply('❌ Could not determine the target user.');

        // ─── 2. FETCH PROFILE PICTURE ───
        await ctx.react('📸');
        
        let ppUrl = null;
        try {
            ppUrl = await sock.profilePictureUrl(targetJid, 'image');
        } catch (err) {
            // If we can't get it, we'll send a fallback
            ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
        }

        // ─── 3. GET NAME & INFO ───
        if (isGroupTarget) {
            try {
                const metadata = await getGroupMetadata(sock, targetJid);
                targetName = metadata.subject || 'Group';
            } catch (e) {
                targetName = 'Group';
            }
        } else {
            // Resolve real number
            const realNumber = await getRealJid(targetJid, sock);
            
            // Try to get Push Name
            if (isGroupChat) {
                try {
                    const metadata = await getGroupMetadata(sock, m.key.remoteJid);
                    const participant = metadata.participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
                    if (participant?.notify) targetName = participant.notify;
                } catch (e) {}
            }
            
            // Fallback to WhatsApp onWhatsApp check
            if (targetName === 'Unknown') {
                try {
                    const waInfo = await sock.onWhatsApp(realNumber + '@s.whatsapp.net');
                    if (waInfo && waInfo.length > 0 && waInfo[0].name) {
                        targetName = waInfo[0].name;
                    } else {
                        targetName = `+${realNumber}`;
                    }
                } catch (e) {
                    targetName = `+${realNumber}`;
                }
            }
        }

        // ─── 4. SEND THE IMAGE ───
        try {
            await sock.sendMessage(m.key.remoteJid, {
                image: { url: ppUrl },
                caption: `📸 *Profile Picture*\n\n*Name:* ${targetName}\n*Type:* ${isGroupTarget ? 'Group' : 'User'}`
            }, { quoted: m });
        } catch (err) {
            console.error('GetPP send error:', err.message);
            await ctx.reply(`❌ Failed to send the profile picture.`);
        }
    }
};