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

  registerHunter(userId, hunterName) {

    for (const id in this.hunters) {

      if (this.hunters[id].hunterName.toLowerCase() === hunterName.toLowerCase()) {

        return { success: false, error: "Hunter name already exists! Choose a different name." };

      }

    }

    this.hunters[userId] = {

      hunterName,

      rank: "E",

      exp: 0,

      mana: 100,

      inventory: {},

      arisenSoldiers: [],

      attempts: { count: 8, lastReset: Date.now() },

    };

    this.saveHunters();

    return { success: true };

  }

  getHunter(userId) {

    return this.hunters[userId] || null;

  }

}

module.exports = {

  name: "hunter",

  description: "Register as a hunter using #hunter register <name>",

  usage: "#hunter register Sung_jinwoo",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    if (!args[0] || args[0].toLowerCase() !== "register" || !args[1]) {

      const errorMessage = format({

        title: "Hunter Registration 📜",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid usage!\nUse #hunter register <name>\nExample: #hunter register Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const hunterName = args.slice(1).join("_");

    const hunterManager = new HunterManager();

    if (hunterManager.getHunter(senderID)) {

      const errorMessage = format({

        title: "Hunter Registration 📜",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are already registered as a hunter!\nUse #inventory_${hunterManager.getHunter(senderID).hunterName} to view your inventory.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const result = hunterManager.registerHunter(senderID, hunterName);

    if (!result.success) {

      const errorMessage = format({

        title: "Hunter Registration 📜",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `${result.error}`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const hunter = hunterManager.getHunter(senderID);

    const successMessage = format({

      title: "Hunter Registration 📜",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Successfully registered Hunter! Here's your information:\nRank: ${hunter.rank}\nHunter Name: ${hunter.hunterName}\nExp: ${hunter.exp}\nMana: ${hunter.mana}\n\nTo grind more exp and become S rank, use #dungeon-fightv2.`,

    });

    return api.sendMessage(successMessage, threadID, messageID);

  },

};