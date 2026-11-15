import { getPrefix } from '../../lib/config.js';

const QUESTIONS = [
    { a: "be able to fly", b: "be able to turn invisible" },
    { a: "read minds", b: "see the future" },
    { a: "be rich but alone", b: "be poor but loved" },
    { a: "have super strength", b: "have super speed" },
    { a: "only eat pizza forever", b: "never eat pizza again" },
    { a: "always be 10 mins late", b: "always be 30 mins early" },
    { a: "live in a mansion in Lagos", b: "live in a small house in London" },
    { a: "have unlimited Wi-Fi", b: "have unlimited food" },
    { a: "be the smartest person alive", b: "be the funniest person alive" },
    { a: "have no phone for a month", b: "have no internet for a month" },
    { a: "fight 100 duck-sized horses", b: "fight 1 horse-sized duck" },
    { a: "know how you will die", b: "know when you will die" }
];

export default {
    command: 'wyr',
    aliases: ['wouldyourather'],
    description: 'Play Would You Rather',
    category: 'Games',
    ownerOnly: false,
    usage: 'wyr',

    async execute(sock, m, args, ctx) {
        const pick = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        
        await ctx.reply(`🤔 *Would You Rather?*\n\n🅰️ ${pick.a}\n\n*OR*\n\n🅱️ ${pick.b}\n\n_Vote with 🅰️ or 🅱️!_`);
    }
};