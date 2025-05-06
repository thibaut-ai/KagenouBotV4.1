const fs = require("fs");

const path = require("path");

module.exports = {

  name: "balance",

  author: "Aljur Pogoy",

  nonPrefix: false, // Requires prefix (e.g., /balance)

  description: "Check your wallet and bank balance.",

  async run({ api, event }) {

    const balanceFile = path.join(__dirname, "../database/balance.json");

    const { threadID, messageID, senderID } = event;

    try {

      // Initialize balance file if it doesn't exist

      if (!fs.existsSync(balanceFile)) {

        fs.writeFileSync(balanceFile, JSON.stringify({}, null, 2));

      }

      // Load balance data

      let balanceData = JSON.parse(fs.readFileSync(balanceFile, "utf8"));

      // Initialize user data if it doesn't exist

      if (!balanceData[senderID]) {

        balanceData[senderID] = { balance: 0, bank: 0 };

        fs.writeFileSync(balanceFile, JSON.stringify(balanceData, null, 2));

      }

      const { balance, bank } = balanceData[senderID];

      // Construct balance message

      let balanceMessage = `════『 𝗕𝗔𝗟𝗔𝗡𝗖𝗘 』════\n\n`;

      balanceMessage += `  ┏━━━━━━━┓\n`;

      balanceMessage += `  ┃ 『 𝗪𝗔𝗟𝗟𝗘𝗧 』 💸 ${balance} coins\n`;

      balanceMessage += `  ┃ 『 𝗕𝗔𝗡𝗞 』 🏦 ${bank} coins\n`;

      balanceMessage += `  ┗━━━━━━━┛\n\n`;

      balanceMessage += `> Thank you for using our Cid Kagenou bot\n`;

      balanceMessage += `> For further assistance, contact: korisawaumu@ gmail.com`;

      api.sendMessage(balanceMessage, threadID, messageID);

    } catch (error) {

      console.error("❌ Error in balance command:", error);

      let errorMessage = `════『 𝗕𝗔𝗟𝗔𝗡𝗖𝗘 』════\n\n`;

      errorMessage += `  ┏━━━━━━━┓\n`;

      errorMessage += `  ┃ 『 𝗜𝗡𝗙𝗢 』 An error occurred while retrieving your balance.\n`;

      errorMessage += `  ┗━━━━━━━┛\n\n`;

      errorMessage += `> Thank you for using our Cid Kagenou bot`;

      api.sendMessage(errorMessage, threadID, messageID);

    }

  },

};