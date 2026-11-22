import { getGroupNotes, addNote, deleteNote } from '../../handlers/notes.js';
import { getGroupMetadata, isSenderAdmin } from '../../lib/utils.js';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'notes',
    description: 'Save and retrieve notes for this group',
    category: 'Group',
    ownerOnly: false,
    usage: 'notes <add|get|list|delete>',

    async execute(sock, m, args, ctx) {
        if (!m.key.remoteJid.endsWith('@g.us')) return ctx.reply('❌ This command only works in groups.');

        const prefix = getPrefix();
        const action = args[0]?.toLowerCase();
        const groupId = m.key.remoteJid;

        if (!action) {
            return ctx.reply(`📝 *Group Notes*\n\n*Usage:*\n\`${prefix}notes add <name> <text>\`\n\`${prefix}notes get <name>\`\n\`${prefix}notes list\`\n\`${prefix}notes delete <name>\``);
        }

        if (action === 'add') {
            try {
                const metadata = await getGroupMetadata(sock, groupId);
                const isAdmin = await isSenderAdmin(sock, groupId, m.key.participant, metadata);
                if (!isAdmin) return ctx.reply('❌ Only admins can add notes.');

                const noteName = args[1]?.toLowerCase();
                const noteText = args.slice(2).join(' ');

                if (!noteName || !noteText) return ctx.reply('❌ Usage: `.notes add <name> <text>`');

                addNote(groupId, noteName, noteText);
                return ctx.reply(`✅ *Note Saved:* \`${noteName}\``);
            } catch (err) {
                return ctx.reply(`❌ Error: ${err.message}`);
            }
        }

        if (action === 'get') {
            const noteName = args[1]?.toLowerCase();
            if (!noteName) return ctx.reply('❌ Provide the name of the note to get.');

            const notes = getGroupNotes(groupId);
            if (!notes[noteName]) return ctx.reply(`❌ Note \`${noteName}\` not found.`);

            return ctx.reply(`📝 *Note: ${noteName}*\n\n${notes[noteName]}`);
        }

        if (action === 'list') {
            const notes = getGroupNotes(groupId);
            const keys = Object.keys(notes);
            
            if (keys.length === 0) return ctx.reply('📭 No notes saved in this group.');
            
            let text = `📝 *Saved Notes (${keys.length})*\n\n`;
            keys.forEach((key, i) => { text += `${i + 1}. \`${key}\`\n`; });
            text += `\n_Use \`${prefix}notes get <name>\` to read a note._`;
            
            return ctx.reply(text);
        }

        if (action === 'delete' || action === 'del') {
            try {
                const metadata = await getGroupMetadata(sock, groupId);
                const isAdmin = await isSenderAdmin(sock, groupId, m.key.participant, metadata);
                if (!isAdmin) return ctx.reply('❌ Only admins can delete notes.');

                const noteName = args[1]?.toLowerCase();
                if (!noteName) return ctx.reply('❌ Provide the name of the note to delete.');

                if (deleteNote(groupId, noteName)) {
                    return ctx.reply(`✅ Note \`${noteName}\` deleted.`);
                } else {
                    return ctx.reply(`❌ Note \`${noteName}\` not found.`);
                }
            } catch (err) {
                return ctx.reply(`❌ Error: ${err.message}`);
            }
        }
    }
};