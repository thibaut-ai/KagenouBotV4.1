const fs = require("fs-extra");

const path = require("path");

const { format, UNIRedux } = require("cassidy-styler");

class HunterManager {

  constructor() {

    this.huntersFile = path.join(__dirname, "../database/hunters.json");

    this.hunters = this.loadHunters();

  }

  loadHunters() {

    try {

      return JSON.parse(fs.readFileSync(this.huntersFile, "utf8"));

    } catch (error) {

      return {};

    }

  }

  saveHunters() {

    fs.writeFileSync(this.huntersFile, JSON.stringify(this.hunters, null, 2));

  }

  getHunter(userId) {

    return this.hunters[userId] || null;

  }

  updateHunter(userId, updates) {

    if (this.hunters[userId]) {

      Object.assign(this.hunters[userId], updates);

      this.saveHunters();

    }

  }

}

// List of valid boss names for validation

const validBosses = ["Igris", "Beru", "Tusk", "Iron", "Tank", "Kamish"];

module.exports = {

  name: "arise",

  description: "Arise a shadow from a defeated boss using #arise <bossname> <nickname>",

  usage: "#arise <bossname> <nickname>",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const hunterManager = new HunterManager();

    const hunter = hunterManager.getHunter(senderID);

    // Check if user is registered

    if (!hunter) {

      const errorMessage = format({

        title: "Arise Shadow ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    // Check if arguments are provided

    if (args.length < 2) {

      const errorMessage = format({

        title: "Arise Shadow ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid format! Please use: #arise <bossname> <nickname>\nExample: #arise kamish shadowKamish`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const bossName = args[0].toLowerCase();

    const nickname = args.slice(1).join(" "); // Join the rest as the nickname

    // Validate the boss name against the list of valid bosses

    const validBoss = validBosses.find(boss => boss.toLowerCase() === bossName);

    if (!validBoss) {

      const errorMessage = format({

        title: "Arise Shadow ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid boss name! Valid bosses are: ${validBosses.join(", ")}`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    // Check if the boss is in the user's defeatedBosses

    hunter.defeatedBosses = hunter.defeatedBosses || [];

    const bossIndex = hunter.defeatedBosses.findIndex(boss => boss.toLowerCase() === bossName);

    if (bossIndex === -1) {

      const errorMessage = format({

        title: "Arise Shadow ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You haven't defeated ${validBoss} yet! Defeat the boss in a dungeon fight first.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    // Remove the boss from defeatedBosses

    hunter.defeatedBosses.splice(bossIndex, 1);

    // Add the arisen shadow to arisenSoldiers

    hunter.arisenSoldiers = hunter.arisenSoldiers || [];

    hunter.arisenSoldiers.push({ name: validBoss, nickname });

    // Save the updated hunter data

    hunterManager.updateHunter(senderID, {

      defeatedBosses: hunter.defeatedBosses,

      arisenSoldiers: hunter.arisenSoldiers,

    });

    const successMessage = format({

      title: "Arise Shadow ⚔️",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Successfully arisen the shadow named ${nickname}!`,

    });

    return api.sendMessage(successMessage, threadID, messageID);

  },

};