import { getGroupMetadata, extractRawId } from '../../lib/utils.js';

export default {
    command: 'vcf',
    aliases: ['exportcontacts'],
    description: 'Extract all group members numbers into a VCF file',
    category: 'Group',
    ownerOnly: false,
    usage: 'vcf',

    async execute(sock, m, args, ctx) {
        const jid = m.key.remoteJid;
        
        // 1. Ensure it's a group
        if (!jid.endsWith('@g.us')) {
            return ctx.reply('❌ This command only works in groups.');
        }

        await ctx.reply('📇 *Extracting contacts...*');

        try {
            const metadata = await getGroupMetadata(sock, jid);
            const participants = metadata.participants || [];

            if (participants.length === 0) {
                return ctx.reply('❌ No members found in this group.');
            }

            let vcardText = '';
            let validCount = 0;

            for (const p of participants) {
                // 2. Resolve Phone Number (Handles both standard JIDs and LIDs)
                let phone = p.phoneNumber ? extractRawId(p.phoneNumber) : extractRawId(p.id);
                
                if (!phone || phone.length < 5) continue; // Skip invalid numbers

                // 3. Get Name (Push Name or fallback to number)
                let name = p.notify || p.name || `+${phone}`;

                // 4. Build vCard Format
                vcardText += `BEGIN:VCARD\n`;
                vcardText += `VERSION:3.0\n`;
                vcardText += `FN:${name}\n`;
                vcardText += `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\n`;
                vcardText += `END:VCARD\n`;

                validCount++;
            }

            if (validCount === 0) {
                return ctx.reply('❌ Could not extract any valid phone numbers.');
            }

            // 5. Convert to Buffer and Send
            const buffer = Buffer.from(vcardText, 'utf-8');
            
            // Clean group name for the filename
            const safeName = metadata.subject.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `${safeName}_members.vcf`;

            await sock.sendMessage(jid, {
                document: buffer,
                mimetype: 'text/vcard',
                fileName: fileName,
                caption: `📇 *Contacts Exported*\n\n*Group:* ${metadata.subject}\n*Total Members:* ${participants.length}\n*Exported:* ${validCount}\n\n_Tap to download and import to your phone._`
            }, { quoted: m });

        } catch (err) {
            console.error('VCF error:', err);
            await ctx.reply(`❌ *Error:* Failed to generate VCF file.\n_${err.message}_`);
        }
    }
};