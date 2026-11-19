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

        await ctx.react('📸');
        
        // ─── 2. RESOLVE JID & FETCH PP ───
        let ppUrl = null;
        
        if (isGroupTarget) {
            try {
                ppUrl = await sock.profilePictureUrl(targetJid, 'image');
            } catch (err) {
                ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
            }
        } else {
            // Resolve the LID to a real phone number
            const realNumber = await getRealJid(targetJid, sock);
            let resolvedJid = targetJid;
            
            // If we have a valid phone number, use that format
            if (realNumber && realNumber.length > 5) {
                resolvedJid = realNumber + '@s.whatsapp.net';
            }

            try {
                // Try fetching with the resolved JID first
                ppUrl = await sock.profilePictureUrl(resolvedJid, 'image');
            } catch (err) {
                // Fallback to the original targetJid (might be a LID that Baileys can resolve internally)
                try {
                    ppUrl = await sock.profilePictureUrl(targetJid, 'image');
                } catch (err2) {
                    ppUrl = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
                }
            }

            // ─── 3. GET NAME ───
            if (isGroupChat) {
                try {
                    const metadata = await getGroupMetadata(sock, m.key.remoteJid);
                    const participant = metadata.participants.find(p => p.id === targetJid || p.phoneNumber === targetJid);
                    if (participant?.notify) targetName = participant.notify;
                } catch (e) {}
            }
            
            if (targetName === 'Unknown' && realNumber) {
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

        // If it's a group, get the group name
        if (isGroupTarget) {
            try {
                const metadata = await getGroupMetadata(sock, targetJid);
                targetName = metadata.subject || 'Group';
            } catch (e) {
                targetName = 'Group';
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