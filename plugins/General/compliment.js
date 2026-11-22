import axios from 'axios';

const LOCAL_COMPLIMENTS = [
    "Your smile lights up the whole room! 😊",
    "You have the best ideas, for real.",
    "You're smarter than you think.",
    "Your vibe is just different - in a good way.",
    "You make people feel comfortable just by being you.",
    "Your hard work is going to pay off soon.",
    "You're one of a kind, no copy.",
    "Your laugh is contagious!",
    "You have a heart of gold.",
    "You're doing better than you think.",
    "Your energy is unmatched.",
    "You inspire people without even trying.",
    "You're a blessing to everyone around you.",
    "Your creativity is on another level.",
    "You look amazing today, no lie.",
    "You're stronger than you know.",
    "Your kindness never goes unnoticed.",
    "You're the reason someone smiled today.",
    "You have a beautiful soul.",
    "Keep shining, the world needs your light! ✨",
];

export default {
    command: 'compliment',
    aliases: ['praise', 'sweet'],
    description: 'Get a random compliment',
    category: 'General',
    ownerOnly: false,
    usage: 'compliment',

    async execute(sock, m, args, ctx) {
        let compliment = null;

        // 1. PRIMARY - Affirmations API (working, no key)
        // https://www.affirmations.dev/ -> { affirmation: "..." }
        try {
            const res = await axios.get('https://www.affirmations.dev/', { timeout: 8000 });
            if (res.data?.affirmation) compliment = res.data.affirmation;
        } catch {}

        // 2. SECONDARY - Advice Slip (working, no key) - use as compliment style
        if (!compliment) {
            try {
                const res = await axios.get('https://api.adviceslip.com/advice', { timeout: 8000 });
                if (res.data?.slip?.advice) compliment = res.data.slip.advice;
            } catch {}
        }

        // 3. TERTIARY - ZenQuotes (working, no key)
        if (!compliment) {
            try {
                const res = await axios.get('https://zenquotes.io/api/random', { timeout: 8000 });
                if (Array.isArray(res.data) && res.data[0]?.q) compliment = `${res.data[0].q} - ${res.data[0].a}`;
            } catch {}
        }

        // 4. FINAL - Local list (never fails)
        if (!compliment) {
            compliment = LOCAL_COMPLIMENTS[Math.floor(Math.random() * LOCAL_COMPLIMENTS.length)];
        }

        await ctx.reply(`💖 *Compliment*\n\n${compliment}`);
    }
};