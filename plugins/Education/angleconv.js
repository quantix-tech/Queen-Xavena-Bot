import { getPrefix } from '../../lib/config.js';

function parseAngleValue(raw) {
    let str = raw.toLowerCase().replace(/π/g, 'pi').replace(/\s+/g, '');

    // If it contains pi, evaluate it safely: pi, pi/2, 2pi, 3pi/2, 2*pi, pi/3
    if (str.includes('pi')) {
        // Handle implicit multiplication: 2pi -> 2*Math.PI, pi2 -> Math.PI*2 (rare)
        str = str.replace(/(\d)pi/g, '$1*Math.PI');
        str = str.replace(/pi(\d)/g, 'Math.PI*$1');
        str = str.replace(/pi/g, 'Math.PI');

        // Only allow safe characters
        if (!/^[0-9.\+\-\*\/\(\)MathPI]+$/.test(str)) return NaN;

        try {
            const result = Function(`"use strict"; return (${str})`)();
            return typeof result === 'number' ? result : NaN;
        } catch {
            return NaN;
        }
    }

    return parseFloat(str);
}

function formatNum(n) {
    if (Math.abs(n) < 0.000001 && n !== 0) return n.toExponential(4);
    return parseFloat(n.toFixed(6)).toString();
}

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
            return ctx.reply(`📐 *Angle Converter*\n\nUsage: \`${prefix}angleconv 90 deg to rad\`\nExample: \`${prefix}angleconv pi/2 rad to deg\`\nExample: \`${prefix}angleconv pi rad to deg\`\n\n*Supported units:*\n• deg / degree / degrees\n• rad / radian / radians\n• grad / gradian / gradians / gon\n• turn / turns / rev / revolution\n• arcmin / arcsec`);
        }

        let cleaned = input.toLowerCase().replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
        cleaned = cleaned.replace(/(\d)([a-z])/g, '$1 $2'); // 90deg -> 90 deg

        // Merge split pi expressions: "pi / 2" -> "pi/2"
        cleaned = cleaned.replace(/pi\s*\/\s*/g, 'pi/');
        cleaned = cleaned.replace(/pi\s*\*\s*/g, 'pi*');

        const parts = cleaned.split(' ').filter(Boolean);
        const filtered = parts.filter(p => p !== 'to' && p !== 'in' && p !== '->');

        if (filtered.length < 2) {
            return ctx.reply(`❌ Invalid format.\nTry: \`${prefix}angleconv 90 deg to rad\` or \`${prefix}angleconv pi/2 rad to deg\``);
        }

        // If user typed "pi / 2 rad", filtered becomes ["pi/2", "rad"] after merge.
        // If they typed "2 pi rad", handle it: join first two if second is pi-related
        let valueRaw = filtered[0];
        let fromIndex = 1;
        if (filtered[0] === 'pi' && filtered[1] && !isNaN(parseFloat(filtered[1]))) {
            valueRaw = filtered[0];
            fromIndex = 1;
        } else if (!isNaN(parseFloat(filtered[0])) && filtered[1] === 'pi') {
            valueRaw = `${filtered[0]}pi`;
            fromIndex = 2;
        }

        const fromRaw = filtered[fromIndex];
        const toRaw = filtered[fromIndex + 1] || 'deg';

        const value = parseAngleValue(valueRaw);

        if (isNaN(value)) {
            return ctx.reply(`❌ "${valueRaw}" is not a valid number.\nTry: \`${prefix}angleconv 90 deg to rad\` or \`${prefix}angleconv pi/2 rad to deg\``);
        }

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

        let inDegrees;
        switch (from) {
            case 'deg': inDegrees = value; break;
            case 'rad': inDegrees = value * (180 / Math.PI); break;
            case 'grad': inDegrees = value * 0.9; break;
            case 'turn': inDegrees = value * 360; break;
            case 'arcmin': inDegrees = value / 60; break;
            case 'arcsec': inDegrees = value / 3600; break;
            case 'mil': inDegrees = value * 0.05625; break;
            case 'mrad': inDegrees = value * (180 / Math.PI) / 1000; break;
        }

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

        let extra = '';
        if (to === 'rad' && Math.abs(inDegrees % 90) < 0.0001) {
            const piVal = result / Math.PI;
            extra = `\n\n*In terms of π:* ${formatNum(piVal)}π`;
        }

        // Show original pi expression if user used pi
        const displayValue = valueRaw.includes('pi') ? valueRaw : formatNum(value);

        return ctx.reply(
            `📐 *Angle Conversion*\n\n` +
            `*${displayValue} ${pretty[from]}*\n` +
            `=\n` +
            `*${formatNum(result)} ${pretty[to]}*${extra}`
        );
    }
};