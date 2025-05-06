const { format, UNIRedux } = require("cassidy-styler");

const ShadowManager = require("../utils/ShadowManager");

module.exports = {

  name: "shadow",

  description: "Register as a Shadow member using #shadow register <name>",

  usage: "#shadow register Cid_kagenou",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    if (!args[0] || args[0].toLowerCase() !== "register" || !args[1]) {

      const errorMessage = format({

        title: "Shadow Registration 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid usage!\nUse #shadow register <name>\nExample: #shadow register Cid_kagenou`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const shadowName = args.slice(1).join("_");

    const shadowManager = new ShadowManager();

    if (shadowManager.getShadow(senderID)) {

      const errorMessage = format({

        title: "Shadow Registration 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are already registered as a Shadow!\nUse #character-list to choose a character.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const result = shadowManager.registerShadow(senderID, shadowName);

    if (!result.success) {

      const errorMessage = format({

        title: "Shadow Registration 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `${result.error}`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const successMessage = format({

      title: "Shadow Registration 🖤",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Successfully registered Shadow! Welcome, ${shadowName}\nBalance: 0\n\nChoose a character with #character-choose <name> and fight with #fight!`,

    });

    return api.sendMessage(successMessage, threadID, messageID);

  },

};