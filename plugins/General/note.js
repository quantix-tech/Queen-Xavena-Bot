import { getNote, saveNote, deleteNote } from '../../handlers/tasks.js';
export default {
    command: 'note', aliases: ['savenote', 'delnote', 'getnote'], description: 'Simple note system', category: 'General', ownerOnly: false, usage: 'note <text> / savenote <text> / delnote',
    async execute(sock, m, args, ctx) {
        const cmd = ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase();
        const text = args.join(' ');
        const userId = m.key.participant || m.key.remoteJid;

        if (cmd === 'note' || cmd === 'savenote') {
            if (!text) return ctx.reply('❌ Provide text to save.');
            saveNote(userId, text);
            return ctx.reply('✅ *Note Saved!*');
        }
        if (cmd === 'getnote') {
            const note = getNote(userId);
            if (!note) return ctx.reply('📭 No note saved.');
            return ctx.reply(`📝 *Your Note*\n\n${note}`);
        }
        if (cmd === 'delnote') {
            if (deleteNote(userId)) return ctx.reply('✅ Note deleted.');
            return ctx.reply('❌ No note found.');
        }
    }
};