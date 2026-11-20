import axios from 'axios';
import { getPrefix } from '../../lib/config.js';

export default {
    command: 'quran',
    aliases: ['quranverse'],
    description: 'Lookup Quran verses',
    category: 'Education',
    ownerOnly: false,
    usage: 'quran <surah:ayah> OR quran <surah> OR quran random',

    async execute(sock, m, args, ctx) {
        const prefix = getPrefix();
        const query = args.join(' ').trim().toLowerCase();

        if (!query) {
            return ctx.reply(`📖 *Quran*\n\n*Usage:*\n\`${prefix}quran <surah>:<ayah>\`\n\`${prefix}quran <surah>\`\n\`${prefix}quran random\`\n\n*Examples:*\n\`${prefix}quran 2:255\`\n\`${prefix}quran 36\`\n\`${prefix}quran random\``);
        }

        try {
            if (query === 'random') {
                const randomSurah = Math.floor(Math.random() * 114) + 1;
                const surahRes = await axios.get(`https://api.alquran.cloud/v1/surah/${randomSurah}`, { timeout: 15000 });
                const totalAyahs = surahRes.data?.data?.numberOfAyahs || 1;
                const randomAyah = Math.floor(Math.random() * totalAyahs) + 1;

                const res = await axios.get(`https://api.alquran.cloud/v1/ayah/${randomSurah}:${randomAyah}/editions/quran-uthmani,en.sahih`, { timeout: 15000 });
                const data = res.data?.data || [];

                const arabic = data[0];
                const english = data[1];

                if (!arabic || !english) {
                    return ctx.reply(`❌ *Error*\n\nCould not fetch random verse.`);
                }

                const text = `📖 *Quran ${arabic.surah.englishName} ${arabic.numberInSurah}:${arabic.numberInSurah}*\n\n` +
                    `${arabic.text}\n\n` +
                    `"${english.text}"\n\n` +
                    `_${arabic.surah.englishName} — Ayah ${arabic.numberInSurah}_`;

                return ctx.reply(text);
            }

            if (query.includes(':')) {
                const [surah, ayah] = query.split(':');
                const surahNum = parseInt(surah);
                const ayahNum = parseInt(ayah);

                if (isNaN(surahNum) || isNaN(ayahNum) || surahNum < 1 || surahNum > 114) {
                    return ctx.reply(`❌ *Invalid*\n\nSurah must be 1-114 and ayah must be a number.\n*Example:* \`${prefix}quran 2:255\``);
                }

                const res = await axios.get(`https://api.alquran.cloud/v1/ayah/${surahNum}:${ayahNum}/editions/quran-uthmani,en.sahih`, { timeout: 15000 });
                const data = res.data?.data || [];

                const arabic = data[0];
                const english = data[1];

                if (!arabic || !english) {
                    return ctx.reply(`❌ *Not Found*\n\nCould not find: ${surahNum}:${ayahNum}`);
                }

                const text = `📖 *Quran ${arabic.surah.englishName} ${surahNum}:${ayahNum}*\n\n` +
                    `${arabic.text}\n\n` +
                    `"${english.text}"\n\n` +
                    `_${arabic.surah.englishName} (${arabic.surah.name}) — Ayah ${ayahNum} of ${arabic.surah.numberOfAyahs}_`;

                return ctx.reply(text);
            }

            const surahNum = parseInt(query);

            if (isNaN(surahNum) || surahNum < 1 || surahNum > 114) {
                return ctx.reply(`❌ *Invalid*\n\nSurah must be 1-114.\n*Example:* \`${prefix}quran 36\``);
            }

            const res = await axios.get(`https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,en.sahih`, { timeout: 20000 });
            const data = res.data?.data || [];

            const arabicSurah = data[0];
            const englishSurah = data[1];

            if (!arabicSurah || !englishSurah) {
                return ctx.reply(`❌ *Not Found*\n\nCould not find surah ${surahNum}.`);
            }

            let text = `📖 *Surah ${arabicSurah.englishName} (${arabicSurah.name})*\n`;
            text += `_${arabicSurah.englishNameTranslation} — ${arabicSurah.numberOfAyahs} ayahs_\n`;
            text += `_Revelation: ${arabicSurah.revelationType}_\n\n`;

            for (let i = 0; i < arabicSurah.ayahs.length; i++) {
                const a = arabicSurah.ayahs[i];
                const e = englishSurah.ayahs[i];
                text += `*${a.numberInSurah}.* ${a.text}\n`;
                text += `"${e.text}"\n\n`;

                if (text.length > 40000) {
                    text += `\n... (surah too long, truncated at ayah ${a.numberInSurah})`;
                    break;
                }
            }

            await ctx.reply(text);
        } catch (error) {
            console.error('Quran error:', error.message);
            await ctx.reply(`❌ *Error*\n\nFailed to fetch Quran verse.\n_Note:_ ${error.message}`);
        }
    }
};