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

  getHunter(userId) {

    return this.hunters[userId] || null;

  }

}

module.exports = {

  name: "arise-list",

  description: "View your list of arisen shadows using #arise-list",

  usage: "#arise-list",

  async run({ api, event }) {

    const { threadID, messageID, senderID } = event;

    const hunterManager = new HunterManager();

    const hunter = hunterManager.getHunter(senderID);

    // Check if user is registered

    if (!hunter) {

      const errorMessage = format({

        title: "Arise List ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    // Check if the user has any arisen soldiers

    hunter.arisenSoldiers = hunter.arisenSoldiers || [];

    if (hunter.arisenSoldiers.length === 0) {

      const message = format({

        title: "Arise List ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You have not arisen any shadows yet!\nDefeat bosses in #dungeon-fightv2 and use #arise <bossname> <nickname> to arise them.`,

      });

      return api.sendMessage(message, threadID, messageID);

    }

    // Build the list of arisen soldiers

    const arisenList = hunter.arisenSoldiers.map((soldier, index) => {

      return `${index + 1}. ${soldier.name} (Nickname: ${soldier.nickname})`;

    }).join("\n");

    const message = format({

      title: "Arise List ⚔️",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Your Arisen Shadows:\n${arisenList}`,

    });

    return api.sendMessage(message, threadID, messageID);

  },

};