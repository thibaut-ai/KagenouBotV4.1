const { format, UNIRedux } = require("cassidy-styler");

const ShadowManager = require("../utils/ShadowManager");

module.exports = {

  name: "artifact-shop",

  description: "View or buy artifacts, weapons, and Seven Shadows",

  usage: "#artifact-shop | #artifact-shop <key name> <damage option> <quantity>",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const shadowManager = new ShadowManager();

    const artifacts = {

      blckSlime_sword: { name: "Black Slime Sword", desc: "A dark blade forged from slime essence", damage: 500, price: 1000 },

      shadowDagger: { name: "Shadow Dagger", desc: "A stealthy weapon for silent kills", damage: 300, price: 600 },

    };

    const sevenShadows = {

      alpha: { name: "Alpha", desc: "Leader of the Seven Shadows, expert swordswoman", damage: 800, price: 2000 },

      beta: { name: "Beta", desc: "Strategist with magical prowess", damage: 700, price: 1800 },

      gamma: { name: "Gamma", desc: "Support with healing abilities", damage: 600, price: 1500 },

      delta: { name: "Delta", desc: "Beast-like fighter with brute strength", damage: 900, price: 2200 },

      epsilon: { name: "Epsilon", desc: "Graceful dancer with deadly precision", damage: 750, price: 1900 },

      zeta: { name: "Zeta", desc: "Cunning infiltrator", damage: 650, price: 1600 },

      eta: { name: "Eta", desc: "Mysterious assassin", damage: 700, price: 1800 },

    };

    if (!args[0]) {

      const items = Object.values({ ...artifacts, ...sevenShadows })

        .map(item => `${item.name} - ${item.desc} (Damage: ${item.damage}, Price: ${item.price} balance)`)

        .join("\n");

      const message = format({

        title: "Artifact Shop 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Available items:\n${items}\n\nBuy with #artifact-shop <key name> <damage option> <quantity>\nExample: #artifact-shop blckSlime_sword damage-500 5`,

      });

      return api.sendMessage(message, threadID, messageID);

    }

    const itemKey = args[0].toLowerCase();

    const damageOption = args[1];

    const quantity = parseInt(args[2]) || 1;

    const item = { ...artifacts, ...sevenShadows }[itemKey];

    if (!item) {

      const errorMessage = format({

        title: "Artifact Shop 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Item not found! Use #artifact-shop to see available items.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    if (!shadowManager.getShadow(senderID)) {

      const errorMessage = format({

        title: "Artifact Shop 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You must register as a Shadow first with #shadow register <name>!`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const totalCost = item.price * quantity;

    if (!shadowManager.deductFromBalance(senderID, totalCost)) {

      const errorMessage = format({

        title: "Artifact Shop 🖤",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Insufficient balance! You need ${totalCost} balance (Current: ${shadowManager.getBalance(senderID)}).`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    shadowManager.addToInventory(senderID, itemKey, quantity);

    const successMessage = format({

      title: "Artifact Shop 🖤",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Purchased ${quantity} x ${item.name} for ${totalCost} balance!\nNew balance: ${shadowManager.getBalance(senderID)}\nDeploy Seven Shadows with #deploy-seven-shades if purchased.`,

    });

    return api.sendMessage(successMessage, threadID, messageID);

  },

};