import { getReminders, addReminder, deleteReminder } from '../../handlers/tasks.js';
import { delay } from '@itsliaaa/baileys';
export default {
    command: 'remind', aliases: ['reminders', 'delreminder'], description: 'Set a reminder', category: 'General', ownerOnly: false, usage: 'remind <time> <text>',
    async execute(sock, m, args, ctx) {
        const cmd = ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase();
        const userId = m.key.participant || m.key.remoteJid;

        if (cmd === 'reminders') {
            const rems = getReminders(userId);
            if (rems.length === 0) return ctx.reply('📭 No reminders set.');
            let list = `⏰ *Your Reminders*\n\n`;
            rems.forEach((r, i) => {
                const date = new Date(r.timestamp).toLocaleString();
                list += `${i+1}. ${r.text} (${date})\n`;
            });
            return ctx.reply(list);
        }

        if (cmd === 'delreminder') {
            const num = parseInt(args[0]) - 1;
            if (isNaN(num)) return ctx.reply('❌ Provide a reminder number.');
            if (deleteReminder(userId, num)) return ctx.reply('✅ Reminder deleted.');
            return ctx.reply('❌ Reminder not found.');
        }

        if (cmd === 'remind') {
            const time = args[0];
            const text = args.slice(1).join(' ');
            if (!time || !text) return ctx.reply('❌ Usage: `.remind 10m Take a break`');
            
            const match = time.match(/^(\d+)([smh])$/);
            if (!match) return ctx.reply('❌ Invalid time format. Use `10s`, `5m`, `1h`.');
            
            const value = parseInt(match[1]);
            const unit = match[2];
            let ms = value * 1000;
            if (unit === 'm') ms = value * 60000;
            if (unit === 'h') ms = value * 3600000;

            const timestamp = Date.now() + ms;
            addReminder(userId, text, timestamp);
            await ctx.reply(`⏰ *Reminder Set!*\nI will remind you in ${time}.`);

            setTimeout(async () => {
                await sock.sendMessage(m.key.remoteJid, { text: `⏰ *Reminder!*\n\n${text}` });
            }, ms);
        }
    }
};