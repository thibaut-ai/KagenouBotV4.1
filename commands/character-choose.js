const { format, UNIRedux } = require("cassidy-styler");

const ShadowManager = require("../utils/ShadowManager");

module.exports = {

  name: "character-choose",

  description: "Choose a character to use in battles",

  usage: "#character-choose Cid_kagenou",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    if (!args[0]) {

      const errorMessage = format({

        title: "Character Choice 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid usage!\nUse #character-choose <name>\nExample: #character-choose Cid_kagenou`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const characterName = args.join(" ");

    const shadowManager = new ShadowManager();

    if (!shadowManager.getShadow(senderID)) {

      const errorMessage = format({

        title: "Character Choice 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You must register as a Shadow first with #shadow register <name>!`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const result = shadowManager.chooseCharacter(senderID, characterName);

    if (!result.success) {

      const errorMessage = format({

        title: "Character Choice 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `${result.error}`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const successMessage = format({

      title: "Character Choice 🖤",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `You have chosen ${characterName} as your character!\nUse #fight to start battling!`,

    });

    return api.sendMessage(successMessage, threadID, messageID);

  },

};