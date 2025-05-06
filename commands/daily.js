const fs = require("fs-extra");

const path = require("path");

module.exports = {

  name: "daily",

  author: "Aljur Pogoy",

  description: "Claim your daily reward of 500 coins! (Once every 24 hours)",

  version: "3.0.0",

  usage: "<prefix>daily",

  async run({ api, event }) {

    const { threadID, messageID, senderID } = event;

    const balanceFile = path.join(__dirname, "..", "database", "balance.json");

    const claimsFile = path.join(__dirname, "..", "database", "dailyclaims.json");

    let balances = {};

    try {

      balances = JSON.parse(fs.readFileSync(balanceFile, "utf8"));

    } catch (error) {

      balances = {};

    }

    if (!balances[senderID] || balances[senderID] === null) {

      balances[senderID] = { balance: 0, bank: 0 };

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    }

    let claims = {};

    try {

      claims = JSON.parse(fs.readFileSync(claimsFile, "utf8"));

    } catch (error) {

      claims = {};

    }

    const now = Date.now();

    const lastClaim = claims[senderID] || 0;

    const timeSinceLastClaim = now - lastClaim;

    const cooldown = 24 * 60 * 60 * 1000;

    if (timeSinceLastClaim < cooldown) {

      const remainingTime = cooldown - timeSinceLastClaim;

      const hours = Math.floor(remainingTime / (1000 * 60 * 60));

      const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));

      const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

      let cooldownMessage = "⏳ 『 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 』 ⏳\n\n";

      cooldownMessage += `❌ You already claimed your daily reward!\n`;

      cooldownMessage += `⏰ Please wait ${hours}h ${minutes}m ${seconds}s to claim again.`;

      return api.sendMessage(cooldownMessage, threadID, messageID);

    }

    const reward = 500;

    balances[senderID].balance += reward;

    claims[senderID] = now;

    fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    fs.writeFileSync(claimsFile, JSON.stringify(claims, null, 2));

    let successMessage = "🎁 『 𝗗𝗔𝗜𝗟𝗬 𝗥𝗘𝗪𝗔𝗥𝗗 』 🎁\n\n";

    successMessage += `✅ You claimed your daily reward!\n`;

    successMessage += `💰 Reward: ${reward} coins\n`;

    successMessage += `🏦 New Balance: ${balances[senderID].balance} coins\n\n`;

    successMessage += `⏰ Come back in 24 hours for your next reward!`;

    await api.sendMessage(successMessage, threadID, messageID);

  },

};