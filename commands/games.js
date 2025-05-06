const fs = require("fs-extra");

const path = require("path");

module.exports = {

  name: "games",

  author: "Aljur Pogoy",

  version: "3.0.0",

  description: "Play games to earn coins",

  usage: "#games <game name> <bet> with 40% chance of winning",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const balanceFile = path.join(__dirname, "../database/balance.json");

    const attemptsFile = path.join(__dirname, "../database/gameattempts.json");

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

    let attemptsData = {};

    try {

      attemptsData = JSON.parse(fs.readFileSync(attemptsFile, "utf8"));

    } catch (error) {

      attemptsData = {};

    }

    if (!attemptsData[senderID]) {

      attemptsData[senderID] = { attempts: 6, lastReset: 0 };

    }

    const now = Date.now();

    const cooldownDuration = 5 * 60 * 1000;

    if (attemptsData[senderID].attempts <= 0) {

      const timeSinceLastReset = now - attemptsData[senderID].lastReset;

      if (timeSinceLastReset < cooldownDuration) {

        const timeLeft = Math.ceil((cooldownDuration - timeSinceLastReset) / 1000);

        return api.sendMessage(

          `🎮 『 𝗚𝗔𝗠𝗘𝗦 』 🎮\n\n❌ You've used all your attempts (0/6)! Please wait ${Math.floor(timeLeft / 60)} minutes and ${timeLeft % 60} seconds before playing again.`,

          threadID,

          messageID

        );

      } else {

        attemptsData[senderID].attempts = 6;

        attemptsData[senderID].lastReset = now;

        fs.writeFileSync(attemptsFile, JSON.stringify(attemptsData, null, 2));

      }

    }

    const choice = args[0] ? args[0].toLowerCase() : null;

    if (!choice || !["slot", "archery", "rps"].includes(choice)) {

      let menuMessage = "════『 𝗚𝗔𝗠𝗘𝗦 𝗠𝗘𝗡𝗨 』════\n\n";

      menuMessage += "🎰 『 𝗦𝗟𝗢𝗧 』 - /games slot <bet>\n";

      menuMessage += "🏹 『 𝗔𝗥𝗖𝗛𝗘𝗥�_Y 』 - /games archery <bet>\n";

      menuMessage += "✊ 『 𝗥𝗣𝗦 』 (Rock, Paper, Scissors) - /games rps <bet> rock\n\n";

      menuMessage += `Attempts left: ${attemptsData[senderID].attempts}/6\n\n`;

      menuMessage += "> Play and earn coins!";

      return api.sendMessage(menuMessage, threadID, messageID);

    }

    const bet = parseInt(args[1]);

    if (!args[1] || isNaN(bet) || bet <= 0) {

      return api.sendMessage(

        `❌ Please provide a valid bet amount.\nExample: /games slot 1000\nAttempts left: ${attemptsData[senderID].attempts}/6`,

        threadID,

        messageID

      );

    }

    const userBalance = balances[senderID].balance;

    if (userBalance < bet) {

      return api.sendMessage(

        `💰 Your balance is too low!\nCurrent Balance: ${userBalance} coins\nRequired: ${bet} coins\nAttempts left: ${attemptsData[senderID].attempts}/6`,

        threadID,

        messageID

      );

    }

    attemptsData[senderID].attempts -= 1;

    if (attemptsData[senderID].attempts <= 0) {

      attemptsData[senderID].lastReset = now;

    }

    fs.writeFileSync(attemptsFile, JSON.stringify(attemptsData, null, 2));

    balances[senderID].balance -= bet;

    fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    const saveBalance = () => {

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    };

    let resultMessage = "";

    let winnings = 0;

    if (choice === "slot") {

      const symbols = ["🍒", "🍋", "🍊", "💎", "🔔"];

      const reel1 = symbols[Math.floor(Math.random() * symbols.length)];

      const reel2 = symbols[Math.floor(Math.random() * symbols.length)];

      const reel3 = symbols[Math.floor(Math.random() * symbols.length)];

      resultMessage = "🎰 『 𝗦𝗟𝗢𝗧 𝗖𝗔𝗦𝗜𝗡𝗢 』 🎰\n\n";

      resultMessage += `${reel1} | ${reel2} | ${reel3}\n\n`;

      const winChance = Math.random();

      if (winChance < 0.4 || (reel1 === reel2 && reel2 === reel3)) {

        winnings = bet * 2;

        balances[senderID].balance += winnings;

        resultMessage += `🎉 YOU WIN! 🎉\nWinnings: ${winnings} coins\nNew Balance: ${balances[senderID].balance} coins`;

      } else {

        resultMessage += `💔 YOU LOSE! 💔\nNew Balance: ${balances[senderID].balance} coins`;

      }

    } else if (choice === "archery") {

      const score = Math.floor(Math.random() * 10) + 1;

      resultMessage = "🏹 『 𝗔𝗥𝗖𝗛𝗘𝗥𝗬 』 🏹\n\n";

      resultMessage += `🎯 Your Score: ${score}/10\n\n`;

      if (score >= 5) {

        winnings = Math.floor(bet * 1.5);

        balances[senderID].balance += winnings;

        resultMessage += `🎉 YOU WIN! 🎉\nWinnings: ${winnings} coins\nNew Balance: ${balances[senderID].balance} coins`;

      } else {

        resultMessage += `💔 YOU LOSE! 💔\nNew Balance: ${balances[senderID].balance} coins`;

      }

    } else if (choice === "rps") {

      const userChoice = args[2] ? args[2].toLowerCase() : null;

      if (!userChoice || !["rock", "paper", "scissors"].includes(userChoice)) {

        balances[senderID].balance += bet;

        saveBalance();

        return api.sendMessage(

          `✊ 『 𝗥𝗣𝗦 』 ✊\n\n❌ Please choose rock, paper, or scissors.\nExample: /games rps 1000 rock\nAttempts left: ${attemptsData[senderID].attempts}/6`,

          threadID,

          messageID

        );

      }

      const botChoices = ["rock", "paper", "scissors"];

      const winChance = Math.random();

      let botChoice;

      if (winChance < 0.5) {

        const winConditions = {

          rock: "scissors",

          paper: "rock",

          scissors: "paper",

        };

        botChoice = winConditions[userChoice];

      } else {

        const loseConditions = {

          rock: "paper",

          paper: "scissors",

          scissors: "rock",

        };

        const possibleChoices = botChoices.filter(choice => choice !== loseConditions[userChoice]);

        botChoice = possibleChoices[Math.floor(Math.random() * possibleChoices.length)];

      }

      const emojis = {

        rock: "✊",

        paper: "✋",

        scissors: "✂️",

      };

      resultMessage = "✊ 『 𝗥𝗣𝗦 』 ✊\n\n";

      resultMessage += `You: ${emojis[userChoice]} vs Bot: ${emojis[botChoice]}\n\n`;

      const winConditions = {

        rock: "scissors",

        paper: "rock",

        scissors: "paper",

      };

      if (userChoice === botChoice) {

        balances[senderID].balance += bet;

        resultMessage += `🤝 IT'S A TIE! 🤝\nBalance: ${balances[senderID].balance} coins`;

      } else if (winConditions[userChoice] === botChoice) {

        winnings = bet * 2;

        balances[senderID].balance += winnings;

        resultMessage += `🎉 YOU WIN! 🎉\nWinnings: ${winnings} coins\nNew Balance: ${balances[senderID].balance} coins`;

      } else {

        resultMessage += `💔 YOU LOSE! 💔\nNew Balance: ${balances[senderID].balance} coins`;

      }

    }

    if (attemptsData[senderID].attempts > 0) {

      resultMessage += `\n\nAttempts left: ${attemptsData[senderID].attempts}/6`;

    } else {

      resultMessage += `\n\n❌ No attempts left! Wait 5 minutes to play again.`;

    }

    saveBalance();

    await api.sendMessage(resultMessage, threadID, messageID);

  },

};