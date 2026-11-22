import { getTodos, addTodo, deleteTodo } from '../../handlers/tasks.js';
export default {
    command: 'todo', aliases: ['addtask', 'deltask'], description: 'Manage a todo list', category: 'General', ownerOnly: false, usage: 'todo / addtask <text> / deltask <num>',
    async execute(sock, m, args, ctx) {
        const cmd = ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase();
        const userId = m.key.participant || m.key.remoteJid;
        const text = args.join(' ');

        if (cmd === 'todo') {
            const todos = getTodos(userId);
            if (todos.length === 0) return ctx.reply('📭 Todo list is empty.');
            let list = `📋 *Your Todos*\n\n`;
            todos.forEach((t, i) => list += `${i+1}. ${t.task}\n`);
            return ctx.reply(list);
        }
        if (cmd === 'addtask') {
            if (!text) return ctx.reply('❌ Provide a task.');
            addTodo(userId, text);
            return ctx.reply(`✅ *Added:* ${text}`);
        }
        if (cmd === 'deltask') {
            const num = parseInt(args[0]) - 1;
            if (isNaN(num)) return ctx.reply('❌ Provide a task number.');
            if (deleteTodo(userId, num)) return ctx.reply('✅ Task removed.');
            return ctx.reply('❌ Task not found.');
        }
    }
};