import axios from 'axios';

const LOCAL_ROASTS = [
    "You're so slow, you make dial-up look fast.",
    "Your brain is like WiFi for the whole village - everybody connects but nothing loads.",
    "If dumb was a degree, you'd have PhD.",
    "You bring everyone so much joy... when you leave the room.",
    "Your secrets are safe with me, I never even listen when you tell me.",
    "You're the reason the gene pool needs a lifeguard.",
    "You're like a cloud - when you disappear, it's a beautiful day.",
    "Your phone battery lasts longer than your relationships.",
    "If you were a spice, you'd be flour.",
    "You're proof that evolution can go in reverse.",
    "Your IQ is lower than your shoe size.",
    "You're like a Monday morning - nobody wants you.",
    "You have the personality of a wet sock.",
    "Even Google can't find your sense.",
    "You're the human version of 'loading...'",
    "Your face makes onions cry.",
    "You're so boring, watching paint dry feels like a party.",
    "If you were any slower, you'd be going backwards.",
    "You're the reason why 'mute' button was invented.",
    "Your jokes are like your WiFi - nobody gets them.",
];

export default {
    command: 'roast',
    aliases: ['insult', 'burn'],
    description: 'Get a random roast',
    category: 'General',
    ownerOnly: false,
    usage: 'roast',

    async execute(sock, m, args, ctx) {
        let roast = null;

        // 1. PRIMARY - Evil Insult API (working, no key, no login)
        // https://evilinsult.com/generate_insult.php?lang=en&type=json -> { insult: "..." }
        try {
            const res = await axios.get('https://evilinsult.com/generate_insult.php?lang=en&type=json', { timeout: 8000 });
            if (res.data?.insult) roast = res.data.insult;
        } catch {}

        // 2. SECONDARY - Matt Bas Insult API (working, no key)
        // https://insult.mattbas.org/api/en/insult.json -> { insult: "..." }
        if (!roast) {
            try {
                const res = await axios.get('https://insult.mattbas.org/api/en/insult.json', { timeout: 8000 });
                if (res.data?.insult) roast = res.data.insult;
            } catch {}
        }

        // 3. FINAL - Local list (never fails, even if internet down)
        if (!roast) {
            roast = LOCAL_ROASTS[Math.floor(Math.random() * LOCAL_ROASTS.length)];
        }

        await ctx.reply(`🔥 *Roast*\n\n${roast}`);
    }
};