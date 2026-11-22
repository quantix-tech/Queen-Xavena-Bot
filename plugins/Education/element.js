import { getPrefix } from '../../lib/config.js';
export default {
    command: 'element',
    aliases: ['atom'],
    description: 'Look up an element by symbol or name - atomic number, mass and group',
    category: 'Education',
    usage: 'element <symbol or name>',
    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const q = args.join(' ').toLowerCase();
        if (!q) return ctx.reply(`🧪 *Element Lookup*\n\nUsage: \`${prefix}element Fe\`\nUsage: \`${prefix}element oxygen\``);
        const data = {
            h: ['Hydrogen', 1, 1.008, 'Nonmetal'], he: ['Helium', 2, 4.003, 'Noble Gas'], li: ['Lithium', 3, 6.94, 'Alkali Metal'], be: ['Beryllium', 4, 9.012, 'Alkaline Earth'], b: ['Boron', 5, 10.81, 'Metalloid'], c: ['Carbon', 6, 12.011, 'Nonmetal'], n: ['Nitrogen', 7, 14.007, 'Nonmetal'], o: ['Oxygen', 8, 15.999, 'Nonmetal'], f: ['Fluorine', 9, 18.998, 'Halogen'], ne: ['Neon', 10, 20.18, 'Noble Gas'], na: ['Sodium', 11, 22.99, 'Alkali Metal'], mg: ['Magnesium', 12, 24.305, 'Alkaline Earth'], al: ['Aluminium', 13, 26.982, 'Post-transition'], si: ['Silicon', 14, 28.085, 'Metalloid'], p: ['Phosphorus', 15, 30.974, 'Nonmetal'], s: ['Sulfur', 16, 32.06, 'Nonmetal'], cl: ['Chlorine', 17, 35.45, 'Halogen'], ar: ['Argon', 18, 39.948, 'Noble Gas'], k: ['Potassium', 19, 39.098, 'Alkali Metal'], ca: ['Calcium', 20, 40.078, 'Alkaline Earth'], fe: ['Iron', 26, 55.845, 'Transition Metal'], cu: ['Copper', 29, 63.546, 'Transition Metal'], zn: ['Zinc', 30, 65.38, 'Transition Metal'], ag: ['Silver', 47, 107.87, 'Transition Metal'], sn: ['Tin', 50, 118.71, 'Post-transition'], i: ['Iodine', 53, 126.9, 'Halogen'], au: ['Gold', 79, 196.97, 'Transition Metal'], hg: ['Mercury', 80, 200.59, 'Transition Metal'], pb: ['Lead', 82, 207.2, 'Post-transition'], u: ['Uranium', 92, 238.03, 'Actinide']
        };
        let found = null; let sym = '';
        for (const [k, v] of Object.entries(data)) {
            if (k === q || v[0].toLowerCase() === q) { found = v; sym = k; break; }
        }
        if (!found) return ctx.reply(`❌ Element not found in mini database. Try: H, O, Fe, Au, Na, Ca`);
        return ctx.reply(`🧪 *${found[0]} (${sym.toUpperCase()})*\n\nAtomic Number: *${found[1]}*\nAtomic Mass: *${found[2]} u*\nCategory: *${found[3]}*`);
    }
};