const fs = require("fs-extra");

const path = require("path");

module.exports = {

  name: "bank",

  author: "Aljur Pogoy",

  description: "Manage your bank account!",

  Usage: "/bank <action> [amount/name]",

  version: "3.0.0",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    // Paths to balance.json, bankAccounts.json, and loans.json

    const balanceFile = path.join(__dirname, "..", "database", "balance.json");

    const accountsFile = path.join(__dirname, "..", "database", "bankaccounts.json");

    const loansFile = path.join(__dirname, "..", "database", "loans.json");

    // Load user balances

    let balances = {};

    try {

      balances = JSON.parse(fs.readFileSync(balanceFile, "utf8"));

    } catch (error) {

      balances = {};

    }

    // Ensure user has a balance entry, initialize if null or missing

    if (!balances[senderID] || balances[senderID] === null) {

      balances[senderID] = { balance: 0, bank: 0 };

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    }

    // Load bank accounts

    let accounts = {};

    try {

      accounts = JSON.parse(fs.readFileSync(accountsFile, "utf8"));

    } catch (error) {

      accounts = {};

    }

    // Load loans

    let loans = {};

    try {

      loans = JSON.parse(fs.readFileSync(loansFile, "utf8"));

    } catch (error) {

      loans = {};

    }

    // Check if user is registered

    const action = args[0] ? args[0].toLowerCase() : null;

    if (!accounts[senderID] && action !== "register") {

      return api.sendMessage(

        "🏦 『 𝗕𝗔𝗡𝗞 』 🏦\n\n❌ You need to register first!\nUsage: /bank register <name>\nExample: /bank register Aljur Pogoy",

        threadID,

        messageID

      );

    }

    // Helper function to save all files

    const saveFiles = () => {

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

      fs.writeFileSync(accountsFile, JSON.stringify(accounts, null, 2));

      fs.writeFileSync(loansFile, JSON.stringify(loans, null, 2));

    };

    // Handle actions

    if (!action || !["register", "withdraw", "deposit", "loan", "repay"].includes(action)) {

      let menuMessage = "════『 𝗕𝗔𝗡𝗞 𝗠𝗘𝗡𝗨 』════\n\n";

      menuMessage += "📝 『 𝗥𝗘𝗚𝗜𝗦𝗧𝗘𝗥 』 - /bank register <name>\n";

      menuMessage += "💸 『 𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪 』 - /bank withdraw <amount>\n";

      menuMessage += "💰 『 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 』 - /bank deposit <amount>\n";

      menuMessage += "🏦 『 𝗟𝗢𝗔𝗡 』 - /bank loan <amount>\n";

      menuMessage += "📜 『 𝗥𝗘𝗣𝗔𝗬 』 - /bank repay\n\n";

      menuMessage += "> 𝗠𝗮𝗻𝗮𝗴𝗲 𝘆𝗼𝘂𝗿 𝗰𝗼𝗶𝗻𝘀 𝘄𝗶𝘁𝗵 𝗲𝗮𝘀𝗲!";

      return api.sendMessage(menuMessage, threadID, messageID);

    }

    if (action === "register") {

      // Register action

      const name = args.slice(1).join(" ").trim();

      if (!name) {

        return api.sendMessage(

          "📝 『 𝗥𝗘𝗚𝗜𝗦𝗧𝗘𝗥 』 📝\n\n❌ Please provide your name!\nUsage: /bank register <name>\nExample: /bank register Aljur Pogoy",

          threadID,

          messageID

        );

      }

      if (accounts[senderID]) {

        return api.sendMessage(

          "📝 『 𝗥𝗘𝗚𝗜𝗦𝗧𝗘𝗥 』 📝\n\n❌ You are already registered as " + accounts[senderID] + "!",

          threadID,

          messageID

        );

      }

      accounts[senderID] = name;

      saveFiles();

      let successMessage = "📝 『 𝗥𝗘𝗚𝗜𝗦𝗧𝗘𝗥 』 📝\n\n";

      successMessage += `✅ Successfully registered as ${name}!\n`;

      successMessage += `🏦 You can now use withdraw, deposit, and loan features.`;

      return api.sendMessage(successMessage, threadID, messageID);

    }

    // Validate amount for withdraw, deposit, and loan

    const amount = parseInt(args[1]);

    if (["withdraw", "deposit", "loan"].includes(action) && (!args[1] || isNaN(amount) || amount <= 0)) {

      return api.sendMessage(

        `🏦 『 𝗕𝗔𝗡𝗞 』 🏦\n\n❌ Please provide a valid amount!\nExample: /bank ${action} 100`,

        threadID,

        messageID

      );

    }

    if (action === "withdraw") {

      // Withdraw action

      if (balances[senderID].bank < amount) {

        return api.sendMessage(

          `💸 『 𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪 』 💸\n\n❌ Insufficient funds in your bank!\nBank Balance: ${balances[senderID].bank} coins\nRequired: ${amount} coins`,

          threadID,

          messageID

        );

      }

      balances[senderID].bank -= amount;

      balances[senderID].balance += amount;

      saveFiles();

      let successMessage = "💸 『 𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪 』 💸\n\n";

      successMessage += `✅ Successfully withdrew ${amount} coins!\n`;

      successMessage += `🏦 Bank Balance: ${balances[senderID].bank} coins\n`;

      successMessage += `💰 Wallet Balance: ${balances[senderID].balance} coins`;

      return api.sendMessage(successMessage, threadID, messageID);

    }

    if (action === "deposit") {

      // Deposit action

      if (balances[senderID].balance < amount) {

        return api.sendMessage(

          `💰 『 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 』 💰\n\n❌ Insufficient funds in your wallet!\nWallet Balance: ${balances[senderID].balance} coins\nRequired: ${amount} coins`,

          threadID,

          messageID

        );

      }

      balances[senderID].balance -= amount;

      balances[senderID].bank += amount;

      saveFiles();

      let successMessage = "💰 『 𝗗𝗘𝗣𝗢𝗦𝗜𝗧 』 💰\n\n";

      successMessage += `✅ Successfully deposited ${amount} coins!\n`;

      successMessage += `🏦 Bank Balance: ${balances[senderID].bank} coins\n`;

      successMessage += `💰 Wallet Balance: ${balances[senderID].balance} coins`;

      return api.sendMessage(successMessage, threadID, messageID);

    }

    if (action === "loan") {

      // Loan action

      const maxLoan = 10000;

      const interestRate = 0.1; // 10% interest

      if (loans[senderID]) {

        const totalRepay = loans[senderID].amount + loans[senderID].interest;

        return api.sendMessage(

          `🏦 『 𝗟𝗢𝗔𝗡 』 🏦\n\n❌ You already have an outstanding loan!\nLoan Amount: ${loans[senderID].amount} coins\nInterest: ${loans[senderID].interest} coins\nTotal to Repay: ${totalRepay} coins\n\nPlease repay your loan before taking a new one.`,

          threadID,

          messageID

        );

      }

      if (amount > maxLoan) {

        return api.sendMessage(

          `🏦 『 𝗟𝗢𝗔𝗡 』 🏦\n\n❌ Loan amount cannot exceed ${maxLoan} coins!`,

          threadID,

          messageID

        );

      }

      const interest = Math.floor(amount * interestRate);

      const totalRepay = amount + interest;

      balances[senderID].balance += amount;

      loans[senderID] = { amount, interest };

      saveFiles();

      let successMessage = "🏦 『 𝗟𝗢𝗔𝗡 』 🏦\n\n";

      successMessage += `✅ Successfully borrowed ${amount} coins!\n`;

      successMessage += `💸 Interest (10%): ${interest} coins\n`;

      successMessage += `📜 Total to Repay: ${totalRepay} coins\n`;

      successMessage += `💰 Wallet Balance: ${balances[senderID].balance} coins\n\n`;

      successMessage += `⚠️ Repay your loan before taking a new one!`;

      return api.sendMessage(successMessage, threadID, messageID);

    }

    if (action === "repay") {

      // Repay action

      if (!loans[senderID]) {

        return api.sendMessage(

          `🏦 『 𝗥𝗘𝗣𝗔𝗬 』 🏦\n\n❌ You have no outstanding loan to repay!`,

          threadID,

          messageID

        );

      }

      const totalRepay = loans[senderID].amount + loans[senderID].interest;

      if (balances[senderID].balance < totalRepay) {

        return api.sendMessage(

          `🏦 『 𝗥𝗘𝗣𝗔𝗬 』 🏦\n\n❌ Insufficient funds in your wallet!\nWallet Balance: ${balances[senderID].balance} coins\nRequired to Repay: ${totalRepay} coins`,

          threadID,

          messageID

        );

      }

      balances[senderID].balance -= totalRepay;

      delete loans[senderID];

      saveFiles();

      let successMessage = "🏦 『 𝗥𝗘𝗣𝗔𝗬 』 🏦\n\n";

      successMessage += `✅ Successfully repaid your loan of ${totalRepay} coins!\n`;

      successMessage += `💰 Wallet Balance: ${balances[senderID].balance} coins`;

      return api.sendMessage(successMessage, threadID, messageID);

    }

  },

};