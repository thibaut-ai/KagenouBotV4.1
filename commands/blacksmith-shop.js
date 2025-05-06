const fs = require("fs-extra");

const path = require("path");

const { format, UNIRedux } = require("cassidy-styler");

// Define items with damage variants

const items = [

  {

    key: "mighty_sword",

    name: "Mighty Sword",

    emoji: "⚔️",

    variants: [

      {

        damage_option: "dmg_5",

        damage: 5,

        price: 100,

        description: "A basic Mighty Sword, deals low damage.",

      },

      {

        damage_option: "dmg_15",

        damage: 15,

        price: 300,

        description: "A sturdy Mighty Sword, deals moderate damage.",

      },

      {

        damage_option: "dmg_30",

        damage: 30,

        price: 1000,

        description: "A legendary Mighty Sword, deals high damage!",

      },

    ],

  },

  {

    key: "shadow_dagger",

    name: "Shadow Dagger",

    emoji: "🗡️",

    variants: [

      {

        damage_option: "dmg_5",

        damage: 5,

        price: 80,

        description: "A basic Shadow Dagger, deals low damage.",

      },

      {

        damage_option: "dmg_15",

        damage: 15,

        price: 250,

        description: "A sharp Shadow Dagger, deals moderate damage.",

      },

      {

        damage_option: "dmg_30",

        damage: 30,

        price: 900,

        description: "A deadly Shadow Dagger, deals high damage!",

      },

    ],

  },

  {

    key: "dragon_axe",

    name: "Dragon Axe",

    emoji: "🪓",

    variants: [

      {

        damage_option: "dmg_5",

        damage: 5,

        price: 120,

        description: "A basic Dragon Axe, deals low damage.",

      },

      {

        damage_option: "dmg_15",

        damage: 15,

        price: 350,

        description: "A powerful Dragon Axe, deals moderate damage.",

      },

      {

        damage_option: "dmg_30",

        damage: 30,

        price: 1100,

        description: "A mythical Dragon Axe, deals high damage!",

      },

    ],

  },

];

// Helper functions for item lookup

const getItemByKey = (key, itemList) => itemList.find(item => item.key === key) || null;

const getVariantByDamageOption = (item, damageOption) =>

  item.variants.find(variant => variant.damage_option === damageOption) || null;

const getAllItems = (itemList) => itemList;

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

  saveInventory() {

    fs.writeFileSync(this.inventoryFile, JSON.stringify(this.data, null, 2));

  }

  addItem(userId, itemKey, damageOption, quantity) {

    if (!this.data[userId]) {

      this.data[userId] = {};

    }

    const inventoryKey = `${itemKey}_${damageOption}`; // Store as "mighty_sword_dmg_5"

    if (!this.data[userId][inventoryKey]) {

      this.data[userId][inventoryKey] = 0;

    }

    this.data[userId][inventoryKey] += quantity;

    this.saveInventory();

  }

  removeItem(userId, itemKey, damageOption, quantity) {

    const inventoryKey = `${itemKey}_${damageOption}`;

    if (!this.data[userId] || !this.data[userId][inventoryKey]) {

      return false;

    }

    this.data[userId][inventoryKey] -= quantity;

    if (this.data[userId][inventoryKey] <= 0) {

      delete this.data[userId][inventoryKey];

    }

    this.saveInventory();

    return true;

  }

  getUserInventory(userId) {

    return this.data[userId] || {};

  }

}

module.exports = {

  name: "blacksmith-shop", // Updated command name

  author: "Aljur Pogoy",

  version: "3.0.0",

  description: "bug weapons from the blacksmith-shop",

  usage: "#blacksmith-shop mighty_sword dmg_5 5", // Updated usage

  items,

  getItemByKey,

  getAllItems,

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const balanceFile = path.join(__dirname, "../database/balance.json");

    let balances = {};

    try {

      balances = JSON.parse(fs.readFileSync(balanceFile, "utf8"));

    } catch (error) {

      balances = {};

    }

    if (!balances[senderID] || balances[senderID] === null) {

      balances[senderID] = { balance: 0, bank: 0 };

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    }

    const inventory = new Inventory();

    if (!args[0]) {

      let content = "";

      const allItems = getAllItems(items);

      allItems.forEach(item => {

        content += `${item.emoji} 『 ${item.name} 』\n`;

        content += `Key: ${item.key}\n`;

        content += `Variants:\n`;

        item.variants.forEach(variant => {

          content += `  - ${variant.damage_option} | Damage: ${variant.damage} | Price: ${variant.price} coins\n`;

          content += `    Description: ${variant.description}\n`;

        });

        content += `\n`;

      });

      content += `💰 Your Wallet: ${balances[senderID].balance} coins\n\n`;

      content += `> Use +blacksmith-shop <item_key> <damage_option> <quantity> to craft weapons!\n`; // Updated

      content += `Example: +blacksmith-shop mighty_sword dmg_5 5`;

      const formattedText = format({

        title: "Blacksmith Shop 🔨", // Updated title with hammer emoji

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: content,

      });

      return api.sendMessage(formattedText, threadID, messageID);

    }

    const itemKey = args[0].toLowerCase();

    const damageOption = args[1]?.toLowerCase();

    const quantity = parseInt(args[2]) || 1;

    if (!damageOption || !args[2]) {

      const errorMessage = format({

        title: "Error ❌",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Please provide both a damage option and quantity!\nExample: +blacksmith-shop mighty_sword dmg_5 5`, // Updated

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    if (isNaN(quantity) || quantity <= 0) {

      const errorMessage = format({

        title: "Error ❌",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Please provide a valid quantity!\nExample: +blacksmith-shop ${itemKey} ${damageOption} 5`, // Updated

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const item = getItemByKey(itemKey, items);

    if (!item) {

      const errorMessage = format({

        title: "Error ❌",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Item not found!\nUse +blacksmith-shop to see the blacksmith's offerings.`, // Updated

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const variant = getVariantByDamageOption(item, damageOption);

    if (!variant) {

      const errorMessage = format({

        title: "Error ❌",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Damage option not found for ${item.name}!\nUse +blacksmith-shop to see available options.`, // Updated

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const totalCost = variant.price * quantity;

    if (balances[senderID].balance < totalCost) {

      const errorMessage = format({

        title: "Error 💰",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You don't have enough coins!\nTotal Cost: ${totalCost} coins\nYour Wallet: ${balances[senderID].balance} coins`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    balances[senderID].balance -= totalCost;

    fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    inventory.addItem(senderID, item.key, damageOption, quantity);

    const successMessage = format({

      title: "Blacksmith Shop 🔨", // Updated title

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Successfully crafted ${quantity} ${item.emoji} ${item.name} (${damageOption})!\nTotal Cost: ${totalCost} coins\n💰 New Wallet Balance: ${balances[senderID].balance} coins`, // Updated message

    });

    return api.sendMessage(successMessage, threadID, messageID);

  },

};