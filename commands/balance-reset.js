const { format, UNIRedux } = require("cassidy-styler");

const fs = require("fs-extra");

const path = require("path");

const balanceFile = path.join(__dirname, "../database/balance.json");

module.exports = {

  name: "balance-reset",

  author: "Aljur Pogoy",

  version: "3.0.0",

  description: "Reset a user's coin balance to zero (Admin only). Usage: #resetbalance <uid>",

  async run({ api, event, args, admins }) {

    const { threadID, messageID, senderID } = event;

    // Check if the user is an admin

    if (!admins.includes(senderID)) {

      return api.sendMessage(

        `════『 𝗥𝗘𝗦𝗘𝗧𝗕𝗔𝗟𝗔𝗡𝗖𝗘 』════\n\n❌ Only admins can use this command.\n\n> Thank you for using our Cid Kagenou bot`,

        threadID,

        messageID

      );

    }

    // Check if UID is provided

    if (!args[0]) {

      return api.sendMessage(

        `════『 𝗥𝗘𝗦𝗘𝗧𝗕𝗔𝗟𝗔𝗡𝗖𝗘 』════\n\n❌ Usage: #resetbalance <uid>\nExample: #resetbalance 1234567890\n\n> Thank you for using our Cid Kagenou bot`,

        threadID,

        messageID

      );

    }

    const targetUID = args[0];

    // Load balance data

    let balanceData = {};

    try {

      if (!fs.existsSync(balanceFile)) {

        fs.writeFileSync(balanceFile, JSON.stringify({}, null, 2));

      }

      balanceData = JSON.parse(fs.readFileSync(balanceFile, "utf8"));

    } catch {

      balanceData = {};

    }

    // Check if user exists in balance data

    if (!balanceData[targetUID]) {

      return api.sendMessage(

        `════『 𝗥𝗘𝗦𝗘𝗧𝗕𝗔𝗟𝗔𝗡𝗖𝗘 』════\n\n❌ UID ${targetUID} has no balance data to reset.\n\n> Thank you for using our Cid Kagenou bot`,

        threadID,

        messageID

      );

    }

    // Reset user's balance and bank to 0

    balanceData[targetUID].balance = 0;

    balanceData[targetUID].bank = 0;

    fs.writeFileSync(balanceFile, JSON.stringify(balanceData, null, 2));

    return api.sendMessage(

      `════『 𝗥𝗘𝗦𝗘𝗧𝗕𝗔𝗟𝗔𝗡𝗖𝗘 』════\n\n✅ Balance reset for UID ${targetUID}.\n\n> Thank you for using our Cid Kagenou bot`,

      threadID,

      messageID

    );

  },

};