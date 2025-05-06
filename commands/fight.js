const { format, UNIRedux } = require("cassidy-styler");

const ShadowManager = require("../utils/ShadowManager");

module.exports = {

  name: "fight",

  description: "Fight enemies and bosses from The Eminence in Shadow",

  usage: "#fight",

  async run({ api, event }) {

    const { threadID, messageID, senderID } = event;

    const shadowManager = new ShadowManager();

    const shadow = shadowManager.getShadow(senderID);

    if (!shadow) {

      const errorMessage = format({

        title: "Fight 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You must register as a Shadow first with #shadow register <name>!`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    if (!shadow.character) {

      const errorMessage = format({

        title: "Fight 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Choose a character with #character-choose <name> first!`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    

    const enemies = [

      "Cult of Diablos Knight", "Possessed Knight", "Blood Queen", "Fenrir",

    ];

    const bosses = ["Cult Leader", "Diabolos Incarnate"];

  

    const reward = 500; // Reward for winning

    shadowManager.addToBalance(senderID, reward);

    const message = format({

      title: "Fight 🖤",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `With ${shadow.character}, you defeated all enemies and bosses!\nEnemies: ${enemies.join(", ")}\nBosses: ${bosses.join(", ")}\nReward: +${reward} balance\nNew balance: ${shadowManager.getBalance(senderID)}`,

    });

    return api.sendMessage(message, threadID, messageID);

  },

};