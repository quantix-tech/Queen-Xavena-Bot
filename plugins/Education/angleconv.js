import { getPrefix } from '../../lib/config.js';

export default {
    command: 'angleconv',
    aliases: ['angle', 'angleconvert', 'convertangle'],
    description: 'Convert angles between degrees, radians, gradians, turns',
    category: 'Education',
    ownerOnly: false,
    usage: 'angleconv <value> <from> to <to>',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const input = args.join(' ');

        if (!input) {
            return ctx.reply(`📐 *Angle Converter*\n\nUsage: \`${prefix}angleconv 90 deg to rad\`\nOr: \`${prefix}angleconv 180 deg rad\`\nOr: \`${prefix}angleconv 1.57 rad to deg\`\n\n*Supported units:*\n• deg / degree / degrees\n• rad / radian / radians\n• grad / gradian / gradians / gon\n• turn / turns / rev / revolution\n• arcmin / arcsec`);
        }

        // Parse: 90 deg to rad | 90 deg rad | 90deg to rad
        // Normalize input
        let cleaned = input.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
        cleaned = cleaned.replace(/(\d)([a-z])/g, '$1 $2'); // 90deg -> 90 deg

        const parts = cleaned.split(' ').filter(Boolean);
        // Remove 'to' word
        const filtered = parts.filter(p => p !== 'to' && p !== 'in' && p !== '->');

        if (filtered.length < 2) {
            return ctx.reply(`❌ Wrong format.\nTry: \`${prefix}angleconv 90 deg to rad\``);
        }

        const value = parseFloat(filtered[0]);
        const fromRaw = filtered[1];
        const toRaw = filtered[2] || 'deg'; // default to degrees if no target

        if (isNaN(value)) {
            return ctx.reply(`❌ "${filtered[0]}" no be number.\nTry: \`${prefix}angleconv 90 deg to rad\``);
        }

        // Normalize unit names to base: degrees
        const units = {
            deg: 'deg', degree: 'deg', degrees: 'deg', '°': 'deg',
            rad: 'rad', radian: 'rad', radians: 'rad',
            grad: 'grad', gradian: 'grad', gradians: 'grad', gon: 'grad', gons: 'grad',
            turn: 'turn', turns: 'turn', rev: 'turn', revolution: 'turn', revolutions: 'turn', circle: 'turn',
            arcmin: 'arcmin', arcminute: 'arcmin', arcminutes: 'arcmin', "'": 'arcmin',
            arcsec: 'arcsec', arcsecond: 'arcsec', arcseconds: 'arcsec', '"': 'arcsec',
            mil: 'mil', mils: 'mil',
            mrad: 'mrad', milliradian: 'mrad'
        };

        const from = units[fromRaw];
        const to = units[toRaw];

        if (!from) return ctx.reply(`❌ Unknown unit "${fromRaw}".\nSupported: deg, rad, grad, turn, arcmin, arcsec`);
        if (!to) return ctx.reply(`❌ Unknown unit "${toRaw}".\nSupported: deg, rad, grad, turn, arcmin, arcsec`);

        // 1. Convert FROM unit -> degrees
        let inDegrees;
        switch (from) {
            case 'deg': inDegrees = value; break;
            case 'rad': inDegrees = value * (180 / Math.PI); break;
            case 'grad': inDegrees = value * 0.9; break;
            case 'turn': inDegrees = value * 360; break;
            case 'arcmin': inDegrees = value / 60; break;
            case 'arcsec': inDegrees = value / 3600; break;
            case 'mil': inDegrees = value * 0.05625; break; // NATO mil (6400 per circle)
            case 'mrad': inDegrees = value * (180 / Math.PI) / 1000; break;
        }

        // 2. Convert degrees -> TO unit
        let result;
        switch (to) {
            case 'deg': result = inDegrees; break;
            case 'rad': result = inDegrees * (Math.PI / 180); break;
            case 'grad': result = inDegrees / 0.9; break;
            case 'turn': result = inDegrees / 360; break;
            case 'arcmin': result = inDegrees * 60; break;
            case 'arcsec': result = inDegrees * 3600; break;
            case 'mil': result = inDegrees / 0.05625; break;
            case 'mrad': result = inDegrees * (Math.PI / 180) * 1000; break;
        }

        // Pretty names for display
        const pretty = {
            deg: 'Degrees (°)',
            rad: 'Radians',
            grad: 'Gradians',
            turn: 'Turns',
            arcmin: 'Arcminutes',
            arcsec: 'Arcseconds',
            mil: 'Mils',
            mrad: 'Milliradians'
        };

        // Format number - remove trailing zeros
        const formatNum = (n) => {
            if (Math.abs(n) < 0.000001 && n !== 0) return n.toExponential(4);
            return parseFloat(n.toFixed(6)).toString();
        };

        // Extra useful info if converting to/from degrees
        let extra = '';
        if (to === 'rad' && Math.abs(inDegrees % 90) < 0.0001) {
            const piVal = result / Math.PI;
            extra = `\n\n*In π form:* ${formatNum(piVal)}π`;
        }

        return ctx.reply(
            `📐 *Angle Conversion*\n\n` +
            `*${formatNum(value)} ${pretty[from]}*\n` +
            `=\n` +
            `*${formatNum(result)} ${pretty[to]}*${extra}\n\n` +
            `> Try: \`${prefix}angleconv ${formatNum(value)} ${fromRaw} to deg\``
        );
    }
};