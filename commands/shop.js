const fs = require("fs-extra");
const path = require("path");
const { format, UNIRedux } = require("cassidy-styler");

const items = [
  { key: "diamond_sword", name: "Diamond Sword", emoji: "⚔️", description: "A sharp sword made of diamond, perfect for battles!", price: 500 },
  { key: "strength_coffee", name: "Strength Coffee", emoji: "☕", description: "Boosts your strength with a strong brew!", price: 200 },
  { key: "health_potion", name: "Health Potion", emoji: "🧪", description: "Restores your health in a pinch!", price: 150 },
  { key: "golden_apple", name: "Golden Apple", emoji: "🍎", description: "A rare apple that grants temporary invincibility!", price: 300 },
];

const getItemByKey = (key, itemList) => itemList.find(item => item.key === key) || null;
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
  addItem(userId, itemKey, quantity) {
    if (!this.data[userId]) this.data[userId] = {};
    if (!this.data[userId][itemKey]) this.data[userId][itemKey] = 0;
    this.data[userId][itemKey] += quantity;
    this.saveInventory();
  }
  getUserInventory(userId) {
    return this.data[userId] || {};
  }
}

module.exports = {
  name: "shop",
  author: "Aljur Pogoy",
  version: "3.0.0",
  description: "Buy items from the shop",
  usage: "#shop strength_coffee 5",
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
        content += `${item.emoji} 『 ${item.name} 』\nKey: ${item.key}\nDescription: ${item.description}\nPrice: ${item.price} coins\n\n`;
      });
      content += `💰 Your Wallet: ${balances[senderID].balance} coins\n\n> Use +shop <item_key> <quantity> to buy items!\nExample: +shop strength_coffee 5`;
      const formattedText = format({
        title: "Shop 🛒",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: content,
      });
      return api.sendMessage(formattedText, threadID, messageID);
    }
    const itemKey = args[0].toLowerCase();
    const quantity = parseInt(args[1]) || 1;
    if (isNaN(quantity) || quantity <= 0) {
      const errorMessage = format({
        title: "Error ❌",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `Please provide a valid quantity!\nExample: #shop ${itemKey} 5`,
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
        content: `Item not found!\nUse +shop to see the shop menu.`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    const totalCost = item.price * quantity;
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
    inventory.addItem(senderID, item.key, quantity);
    const successMessage = format({
      title: "Shop 🛒",
      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
      titleFont: "double_struck",
      contentFont: "fancy_italic",
      content: `Successfully purchased ${quantity} ${item.emoji} ${item.name}!\nTotal Cost: ${totalCost} coins\n💰 New Wallet Balance: ${balances[senderID].balance} coins`,
    });
    return api.sendMessage(successMessage, threadID, messageID);
  },
};