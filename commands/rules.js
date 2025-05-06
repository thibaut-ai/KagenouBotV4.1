module.exports = {

  name: 'rules',

  category: 'Info',

  description: 'Displays the chatbot rules for responsible usage.',

  author: 'Aljur Pogoy',

  version: '3.0.0',

  usage: '/rules',

  run: async ({ api, event }) => {

    const { threadID, messageID } = event;

    const rules = [

      'Be respectful to everyone, including the bot.',

      'No spamming commands.',

      'Avoid excessive use of capital letters.',

      'Do not abuse the bot for trolling or harassment.',

      'No NSFW (Not Safe for Work) content.',

      'Do not try to exploit bugs or glitches.',

      'Avoid excessive flooding (repeating messages rapidly).',

      'Do not impersonate an admin or the bot.',

      'The bot is not responsible for any personal data shared.',

      'Do not send links that may contain malicious content.',

      'The bot has the right to mute or ban users who violate rules.',

      'Admins can update these rules anytime if needed.',

      'Do not request admin privileges through the bot.',

      'No self-promotion, advertisements, or scams.',

      'Follow all Facebook and Messenger community guidelines.',

      'The bot does not tolerate hate speech or discrimination.',

      'If the bot malfunctions, report to an admin instead of abusing it.',

      'The bot cannot provide illegal or sensitive content.',

      'Commands may be logged for security purposes.',

      'Have fun and use the bot responsibly.',

    ];

    // Format rules with numbering and emojis

    const formattedRules = rules.map((rule, index) => `  | 『 ${index + 1}.』 ${rule}`).join('\n');

    // Construct the message

    let message = `====『 𝗖𝗜𝗗 𝗞𝗔𝗚𝗘𝗡𝗢𝗨 𝗕𝗢𝗧 𝗥𝗨𝗟𝗘𝗦 』====\n\n`;

    message += `  ╭─╮\n`;

    message += `  | 『 𝗜𝗡𝗙𝗢 』 Please follow these rules to ensure a positive experience:\n`;

    message += `${formattedRules}\n`;

    message += `  | 📜 Breaking these rules may result in restrictions.\n`;

    message += `  ╰─────────────ꔪ\n\n`;

    message += `> 𝗧𝗵𝗮𝗻𝗸 𝘆𝗼𝘂 𝗳𝗼𝗿 𝘂𝘀𝗶𝗻𝗴 𝗼𝘂𝗿 𝗖𝗶𝗱 𝗞𝗮𝗴𝗲𝗻𝗼𝘂 𝗯𝗼𝘁\n`;

    message += `> 𝗙𝗼𝗿 𝗳𝘂𝗿𝘁𝗵𝗲𝗿 𝗮𝘀𝘀𝗶𝘀𝘁𝗮𝗻𝗰𝗲, 𝗰𝗼𝗻𝘁�_a𝗰𝘁: 𝗸𝗼𝗿𝗶𝘀𝗮𝘄𝗮𝘂𝗺𝘂𝘇𝗮𝗸𝗶@𝗴𝗺𝗮𝗶𝗹.𝗰𝗼𝗺`;

    sendMessage(api, { threadID, message }, messageID);

  },

};