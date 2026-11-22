import { getPrefix } from '../../lib/config.js';
export default {
    command: 'periodictable',
    aliases: ['periodic'],
    description: 'Show a compact periodic table with symbols grouped by period for quick reference',
    category: 'Education',
    usage: 'periodictable',
    async execute(sock, m, args, ctx) {
        return ctx.reply(`🧪 *Periodic Table (First 36)*\n\n*Period 1:* H He\n*Period 2:* Li Be B C N O F Ne\n*Period 3:* Na Mg Al Si P S Cl Ar\n*Period 4:* K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr\n\nUse \`!element Fe\` for details on any element.`);
    }
};