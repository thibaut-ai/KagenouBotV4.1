const fs = require("fs-extra");

const path = require("path");

const { format, UNIRedux } = require("cassidy-styler");

const { items: shopItems, getItemByKey: getShopItemByKey } = require("./shop.js");

const { items: blacksmithItems, getItemByKey: getBlacksmithItemByKey } = require("./blacksmith-shop.js");

class Inventory {

  constructor() {

    this.inventoryFile = path.join(__dirname, "../database/inventory.json");

    this.data = this.loadInventory();

  }

  loadInventory() {

    try {

      return JSON.parse(fs.readFileSync(this.inventoryFile, "utf8"));

    } catch (error) {

      return {};

    }

  }

  getUserInventory(userId) {

    return this.data[userId] || {};

  }

}

const parseBlacksmithInventoryKey = (inventoryKey) => {

  const [itemKey, damageOption] = inventoryKey.split("_dmg_");

  return { itemKey, damageOption: damageOption ? `dmg_${damageOption}` : null };

};

const getShopItemEffect = (itemKey, quantity) => {

  const item = getShopItemByKey(itemKey, shopItems);

  if (item) {

    if (item.key === "health_potion") {

      return `Restores ${20 * quantity} health in dungeon fights`;

    } else if (item.key === "mana_crystal") {

      return `Increases attack by ${5 * quantity} in dungeon fights`;

    }

  }

  return "No effect in dungeon fights";

};

const getBlacksmithItemEffect = (itemKey, damageOption, quantity) => {

  const item = getBlacksmithItemByKey(itemKey, blacksmithItems);

  if (item) {

    const variant = item.variants.find(v => v.damage_option === damageOption);

    if (variant) {

      return `+${variant.damage * quantity} Attack in dungeon fights`;

    }

  }

  return "No effect in dungeon fights";

};

const getBonusItemEffect = (itemKey, quantity) => {

  if (itemKey === "health_potion_bonus") {

    return `Restores ${20 * quantity} health in future fights`;

  } else if (itemKey === "lucky_charm_bonus") {

    return `Increases crit chance by ${5 * quantity}% in future fights`;

  }

  return "No effect in dungeon fights";

};

module.exports = {

  name: "inventory",

  author: "Aljur Pogoy",

  version: "3.1.0",

  description: "View your inventory and item effects for dungeon fights",

  usage: "#inventory",

  async run({ api, event }) {

    const { threadID, messageID, senderID } = event;

    const inventory = new Inventory();

    const userInventory = inventory.getUserInventory(senderID);

    let content = "";

    let hasItems = false;

    let shopContent = "";

    let hasShopItems = false;

    for (const [inventoryKey, quantity] of Object.entries(userInventory)) {

      if (!inventoryKey.includes("_dmg_") && !inventoryKey.includes("_bonus")) {

        const item = getShopItemByKey(inventoryKey, shopItems);

        if (item && quantity > 0) {

          const effect = getShopItemEffect(inventoryKey, quantity);

          shopContent += `${item.emoji} 『 ${item.name} 』: ${quantity}\n`;

          shopContent += `Effect: ${effect}\n\n`;

          hasShopItems = true;

          hasItems = true;

        }

      }

    }

    if (hasShopItems) {

      content += `🛒 Shop Inventory:\n`;

      content += `━━━━━━━━━━━━━━━\n`;

      content += shopContent;

    }

    let blacksmithContent = "";

    let hasBlacksmithItems = false;

    for (const [inventoryKey, quantity] of Object.entries(userInventory)) {

      if (inventoryKey.includes("_dmg_")) {

        const { itemKey, damageOption } = parseBlacksmithInventoryKey(inventoryKey);

        const item = getBlacksmithItemByKey(itemKey, blacksmithItems);

        if (item && quantity > 0 && damageOption) {

          const effect = getBlacksmithItemEffect(itemKey, damageOption, quantity);

          blacksmithContent += `${item.emoji} 『 ${item.name} (${damageOption}) 』: ${quantity}\n`;

          blacksmithContent += `Effect: ${effect}\n\n`;

          hasBlacksmithItems = true;

          hasItems = true;

        }

      }

    }

    if (hasBlacksmithItems) {

      content += `🔨 Blacksmith Inventory:\n`;

      content += `━━━━━━━━━━━━━━━\n`;

      content += blacksmithContent;

    }

    let bonusContent = "";

    let hasBonusItems = false;

    for (const [inventoryKey, quantity] of Object.entries(userInventory)) {

      if (inventoryKey.includes("_bonus")) {

        const baseKey = inventoryKey.replace("_bonus", "");

        const effect = getBonusItemEffect(inventoryKey, quantity);

        bonusContent += `🎁 『 ${baseKey.replace("_", " ").toUpperCase()} 』: ${quantity}\n`;

        bonusContent += `Effect: ${effect}\n\n`;

        hasBonusItems = true;

        hasItems = true;

      }

    }

    if (hasBonusItems) {

      content += `🎁 Bonus Items:\n`;

      content += `━━━━━━━━━━━━━━━\n`;

      content += bonusContent;

    }

    if (!hasItems) {

      content = `❌ Your inventory is empty!\n`;

      content += `Buy items using +shop <item_key> <quantity>\n`;

      content += `Craft weapons using +blacksmith-shop <item_key> <damage_option> <quantity>`;

    }

    content += `> Use +dungeonfight to battle enemies with your items!`;

    const formattedText = format({

      title: "Inventory 🎒",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: content,

    });

    return api.sendMessage(formattedText, threadID, messageID);

  },

};