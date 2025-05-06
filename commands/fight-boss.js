const { format, UNIRedux } = require("cassidy-styler");

const ShadowManager = require("../utils/ShadowManager");

module.exports = {

  name: "fight-boss",

  description: "Fight a boss with a special move",

  usage: "#fight-boss I am atomic | #fight-boss I am all-range atomic",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const shadowManager = new ShadowManager();

    const shadow = shadowManager.getShadow(senderID);

    if (!shadow) {

      const errorMessage = format({

        title: "Fight Boss 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You must register as a Shadow first with #shadow register <name>!`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    if (!args[0]) {

      const errorMessage = format({

        title: "Fight Boss 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid usage!\nUse #fight-boss I am atomic | #fight-boss I am all-range atomic`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const move = args.join(" ").toLowerCase();

    const validMoves = ["i am atomic", "i am all-range atomic"];

    if (!validMoves.includes(move)) {

      const errorMessage = format({

        title: "Fight Boss 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid move! Use #fight-boss I am atomic | #fight-boss I am all-range atomic`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    

    const bosses = ["Cult Leader", "Diabolos Incarnate"];

    const reward = move === "i am atomic" ? 1500 : 2000; // Higher reward for all-range atomic

    shadowManager.addToBalance(senderID, reward);

    const message = format({

      title: "Fight Boss 🖤",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `With ${move}, you obliterated the bosses!\nBosses: ${bosses.join(", ")}\nReward: +${reward} balance\nNew balance: ${shadowManager.getBalance(senderID)}`,

    });

    return api.sendMessage(message, threadID, messageID);

  },

};