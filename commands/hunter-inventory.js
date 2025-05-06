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

  getHunterByName(hunterName) {

    for (const id in this.hunters) {

      if (this.hunters[id].hunterName.toLowerCase() === hunterName.toLowerCase()) {

        return { userId: id, hunter: this.hunters[id] };

      }

    }

    return null;

  }

}

module.exports = {

  name: "hunter-inventory",

  description: "View a hunter's inventory using #hunter-inventory <hunter_name>",

  usage: "#hunter-inventory Sung_jinwoo",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const hunterManager = new HunterManager();

    const hunter = hunterManager.getHunter(senderID);

    if (!hunter) {

      const errorMessage = format({

        title: "Hunter Inventory 🎒",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    if (!args[0]) {

      const errorMessage = format({

        title: "Hunter Inventory 🎒",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Please provide a hunter name!\nUse #hunter-inventory <hunter_name>\nExample: #hunter-inventory Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const hunterName = args.join("_");

    const targetHunter = hunterManager.getHunterByName(hunterName);

    if (!targetHunter) {

      const errorMessage = format({

        title: "Hunter Inventory 🎒",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Hunter ${hunterName} not found!\nEnsure the name is correct.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    if (targetHunter.userId !== senderID) {

      const errorMessage = format({

        title: "Hunter Inventory 🎒",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You do not own the hunter ${hunterName}!\nUse #hunter-inventory ${hunter.hunterName} to view your own inventory.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const hunterData = targetHunter.hunter;

    let content = `Hunter: ${hunterData.hunterName}\nRank: ${hunterData.rank}\nExp: ${hunterData.exp}\n Mana: ${hunterData.mana}\n\n`;

    let hasItems = false;

    content += `Items:\n━━━━━━━━━━━━━━━\n`;

    for (const [itemKey, details] of Object.entries(hunterData.inventory)) {

      let itemName = itemKey;

      let damage = details.damage;

      if (itemKey.includes("_damage-")) {

        const [baseKey, dmgOption] = itemKey.split("_damage-");

        itemName = baseKey.replace("_", " ").toUpperCase();

        content += `🗡️ 『 ${itemName} (damage-${dmgOption}) 』: ${details.quantity}\n`;

        content += `Damage: ${damage}\n`;

        content += `Key: ${baseKey}\n\n`;

      } else {

        itemName = itemKey.replace("_", " ").toUpperCase();

        content += `🧪 『 ${itemName} 』: ${details.quantity}\n`;

        content += `Effect: ${itemKey === "health_potion" ? "Restores 50 health" : itemKey === "mana_potion" ? "Increases mana by 20" : itemKey === "energy_potion" ? "Restores 30 mana" : itemKey === "defense_potion" ? "Reduces damage taken by 10" : "Varies by potion"}\n`;

        content += `Key: ${itemKey}\n\n`;

      }

      hasItems = true;

    }

    if (hunterData.arisenSoldiers.length > 0) {

      content += `Arisen Soldiers:\n━━━━━━━━━━━━━━━\n`;

      hunterData.arisenSoldiers.forEach(soldier => {

        content += `🪦 『 ${soldier.nickname} (${soldier.name}) 』\n\n`;

      });

      hasItems = true;

    }

    if (!hasItems) {

      content += `❌ Your inventory is empty!\nBuy items using #shopv2\n`;

    }

    content += `> Use #dungeon-fightv2 to battle enemies with your items!\n`;

    content += `> Use #hunter-use <hunter_name> <key of item>\n`;

    content += `> Example: #hunter-use ${hunterData.hunterName} celestial_sword`;

    const formattedText = format({

      title: "Hunter Inventory 🎒",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: content,

    });

    return api.sendMessage(formattedText, threadID, messageID);

  },

};