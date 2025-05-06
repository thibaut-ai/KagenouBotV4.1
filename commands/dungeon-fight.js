const fs = require("fs-extra");

const path = require("path");

const { format, UNIRedux } = require("cassidy-styler");

const { items, getItemByKey } = require("./blacksmith-shop.js");

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

    const inventoryKey = `${itemKey}_${damageOption}`;

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

const enemies = [

  { name: "Goblin", emoji: "👹", health: 50, attack: 10, critChance: 0.1 },

  { name: "Skeleton", emoji: "💀", health: 40, attack: 15, critChance: 0.15 },

  { name: "Orc", emoji: "🧝", health: 70, attack: 20, critChance: 0.1 },

  { name: "Dragon", emoji: "🐉", health: 100, attack: 30, critChance: 0.2 },

];

const bonusItems = [

  { key: "health_potion", name: "Health Potion", emoji: "🧪", description: "Restores 20 health in future fights" },

  { key: "lucky_charm", name: "Lucky Charm", emoji: "🍀", description: "Increases crit chance by 5% in future fights" },

];

const getRandomEnemy = () => {

  const randomIndex = Math.floor(Math.random() * enemies.length);

  return { ...enemies[randomIndex] };

};

const parseInventoryKey = (inventoryKey) => {

  const [itemKey, damageOption] = inventoryKey.split("_dmg_");

  return { itemKey, damageOption: `dmg_${damageOption}` };

};

const calculatePlayerStats = (userInventory) => {

  let playerHealth = 100;

  let playerAttack = 10;

  let critChance = 0.1;

  for (const [inventoryKey, quantity] of Object.entries(userInventory)) {

    const { itemKey, damageOption } = parseInventoryKey(inventoryKey);

    const item = getItemByKey(itemKey, items);

    if (item && quantity > 0) {

      const variant = item.variants.find(v => v.damage_option === damageOption);

      if (variant) {

        playerAttack += variant.damage * quantity;

      }

    }

  }

  return { health: playerHealth, attack: playerAttack, critChance };

};

const isCriticalHit = (critChance) => {

  return Math.random() < critChance;

};

module.exports = {

  name: "dungeon-fight",

  author: "Aljur Pogoy",

  version: "3.1.0",

  description: "Fight an enemy in a dungeon using +dungeonfight",

  usage: "#dungeon-fight",

  async run({ api, event }) {

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

    const userInventory = inventory.getUserInventory(senderID);

    const playerStats = calculatePlayerStats(userInventory);

    let playerHealth = playerStats.health;

    let playerAttack = playerStats.attack;

    let playerCritChance = playerStats.critChance;

    const enemy = getRandomEnemy();

    let enemyHealth = enemy.health;

    let enemyAttack = enemy.attack;

    let enemyCritChance = enemy.critChance;

    let battleLog = `You encounter a ${enemy.emoji} ${enemy.name}!\n`;

    battleLog += `Your Stats: ${playerHealth} Health | ${playerAttack} Attack\n`;

    battleLog += `Enemy Stats: ${enemyHealth} Health | ${enemyAttack} Attack\n\n`;

    while (playerHealth > 0 && enemyHealth > 0) {

      let currentPlayerAttack = playerAttack;

      if (isCriticalHit(playerCritChance)) {

        currentPlayerAttack *= 2;

        battleLog += `Critical Hit! `;

      }

      enemyHealth -= currentPlayerAttack;

      battleLog += `You attack the ${enemy.name} for ${currentPlayerAttack} damage!\n`;

      battleLog += `Enemy Health: ${enemyHealth > 0 ? enemyHealth : 0}\n`;

      if (enemyHealth <= 0) break;

      let currentEnemyAttack = enemyAttack;

      if (isCriticalHit(enemyCritChance)) {

        currentEnemyAttack *= 2;

        battleLog += `Enemy Critical Hit! `;

      }

      playerHealth -= currentEnemyAttack;

      battleLog += `${enemy.emoji} ${enemy.name} attacks you for ${currentEnemyAttack} damage!\n`;

      battleLog += `Player Health: ${playerHealth > 0 ? playerHealth : 0}\n`;

      battleLog += `\n`;

    }

    let outcomeMessage = "";

    if (playerHealth <= 0) {

      outcomeMessage = `You were defeated by the ${enemy.emoji} ${enemy.name}! Better luck next time.\n`;

      outcomeMessage += `Visit the +blacksmith-shop to craft stronger weapons!`;

    } else {

      const coinReward = Math.floor(enemy.health * 1.5);

      balances[senderID].balance += coinReward;

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

      outcomeMessage = `You defeated the ${enemy.emoji} ${enemy.name}!\n`;

      outcomeMessage += `💰 Reward: ${coinReward} coins\n`;

      if (Math.random() < 0.1) {

        const bonusItem = bonusItems[Math.floor(Math.random() * bonusItems.length)];

        inventory.addItem(senderID, bonusItem.key, "bonus", 1);

        outcomeMessage += `🎁 Bonus Drop: You found a ${bonusItem.emoji} ${bonusItem.name}!\n`;

        outcomeMessage += `Description: ${bonusItem.description}\n`;

      }

      outcomeMessage += `New Wallet Balance: ${balances[senderID].balance} coins`;

    }

    const formattedText = format({

      title: "Dungeon Fight ⚔️",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `${battleLog}\n${outcomeMessage}`,

    });

    return api.sendMessage(formattedText, threadID, messageID);

  },

};