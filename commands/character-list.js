const { format, UNIRedux } = require("cassidy-styler");

const ShadowManager = require("../utils/ShadowManager");

module.exports = {

  name: "character-list",

  description: "Display all characters from The Eminence in Shadow",

  usage: "#character-list",

  async run({ api, event }) {

    const { threadID, messageID, senderID } = event;

    const shadowManager = new ShadowManager();

    if (!shadowManager.getShadow(senderID)) {

      const errorMessage = format({

        title: "Character List 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You must register as a Shadow first with #shadow register <name>!`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const characters = [

      "Cid Kagenou", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta",

    ];

    const message = format({

      title: "Character List 🖤",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Available characters:\n${characters.join("\n")}\n\nChoose one with #character-choose <name>!`,

    });

    return api.sendMessage(message, threadID, messageID);

  },

};