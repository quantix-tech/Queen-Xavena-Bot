export default {
    command: 'nhie',
    aliases: ['neverhaveiever'],
    description: 'Play Never Have I Ever',
    category: 'Games',
    ownerOnly: false,
    usage: 'nhie',

    async execute(sock, m, args, ctx) {
        const QUESTIONS = [
            "Never have I ever lied to my best friend.",
            "Never have I ever pretended to be sick to skip work or school.",
            "Never have I ever stalked an ex on social media.",
            "Never have I ever cried watching a movie.",
            "Never have I ever eaten food that fell on the floor.",
            "Never have I ever faked a laugh at a bad joke.",
            "Never have I ever forgotten someone's name right after meeting them.",
            "Never have I ever sent a message to the wrong person.",
            "Never have I ever fallen asleep during a call.",
            "Never have I ever said 'I'm on my way' when I hadn't even left the house.",
            "Never have I ever ghosted someone.",
            "Never have I ever screenshotted a chat to send to someone else.",
            "Never have I ever pretended to like a gift I hated.",
            "Never have I ever cried to get what I wanted.",
            "Never have I ever snooped through someone's phone.",
            "Never have I ever fallen for someone I shouldn't have.",
            "Never have I ever lied about my age.",
            "Never have I ever drunk texted someone.",
            "Never have I ever kept a secret from my parents.",
            "Never have I ever talked badly about a friend behind their back."
        ];

        const pick = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
        await ctx.reply(`🍻 *Never Have I Ever*\n\n${pick}`);
    }
};