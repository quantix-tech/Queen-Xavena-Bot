export default {
    command: 'fliptext',
    aliases: ['lower', 'upper', 'titlecase', 'mock', 'reverse', 'spoiler', 'removeemoji'],
    description: 'Text manipulation tools',
    category: 'Tools',
    ownerOnly: false,
    usage: '<command> <text>',

    async execute(sock, m, args, ctx) {
        const command = ctx.text.slice(1).trim().split(/\s+/)[0].toLowerCase();
        const text = args.join(' ');

        if (!text) {
            return ctx.reply(`❌ Please provide text.\nExample: \`.${command} Hello World\``);
        }

        let result = '';

        switch (command) {
            case 'fliptext':
                // Flip text upside down
                const flipMap = {
                    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ', 'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u', 'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n', 'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
                    'A': '∀', 'B': '𐐒', 'C': 'Ɔ', 'D': '◖', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': '⅁', 'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N', 'O': 'O', 'P': 'Ԁ', 'Q': 'Ό', 'R': 'ᴚ', 'S': 'S', 'T': '⊥', 'U': '∩', 'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z'
                };
                result = text.split('').map(c => flipMap[c] || c).reverse().join('');
                break;

            case 'lower':
                result = text.toLowerCase();
                break;

            case 'upper':
                result = text.toUpperCase();
                break;

            case 'titlecase':
                result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
                break;

            case 'mock':
                result = text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('');
                break;

            case 'reverse':
                result = text.split('').reverse().join('');
                break;

            case 'spoiler':
                // Using WhatsApp's spoiler formatting (||text||)
                result = `||${text}||`;
                break;

            case 'removeemoji':
                result = text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/\s+/g, ' ').trim();
                break;
        }

        await ctx.reply(`🔤 *${command.toUpperCase()}*\n\n${result}`);
    }
};