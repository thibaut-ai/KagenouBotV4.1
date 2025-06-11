const { format, UNIRedux } = require("cassidy-styler");

class RPGManager {
  constructor(db, usersData) {
    this.db = db;
    this.usersData = usersData;
  }

  async getPlayer(userId) {
    let userData = this.usersData.get(userId) || {};
    if (this.db) {
      try {
        const userDoc = await this.db.db("users").findOne({ userId });
        userData = userDoc?.data || {};
      } catch (error) {
        console.warn(`[RPGManager] DB access failed for user ${userId}: ${error.message}`);
      }
    }
    if (!userData.inventory) userData.inventory = {};
    if (!userData.registered) userData.registered = false;
    if (!userData.balance) userData.balance = 0;
    if (!userData.exp) userData.exp = 0;
    return userData;
  }

  async registerPlayer(userId) {
    let userData = await this.getPlayer(userId);
    if (userData.registered) {
      return { success: false, error: `You are already registered!` };
    }
    userData = { balance: 100, exp: 0, inventory: {}, registered: true };
    this.usersData.set(userId, userData);
    if (this.db) {
      try {
        await this.db.db("users").updateOne(
          { userId },
          { $set: { userId, data: userData } },
          { upsert: true }
        );
      } catch (error) {
        console.warn(`[RPGManager] DB update failed for user ${userId}: ${error.message}`);
      }
    }
    return { success: true };
  }

  async updatePlayer(userId, updates) {
    let userData = await this.getPlayer(userId);
    userData = { ...userData, ...updates };
    this.usersData.set(userId, userData);
    if (this.db) {
      try {
        await this.db.db("users").updateOne(
          { userId },
          { $set: { userId, data: userData } },
          { upsert: true }
        );
      } catch (error) {
        console.warn(`[RPGManager] DB update failed for user ${userId}: ${error.message}`);
      }
    }
  }

  async addBalance(userId, amount) {
    let userData = await this.getPlayer(userId);
    userData.balance = (userData.balance || 0) + amount;
    await this.updatePlayer(userId, userData);
    return userData.balance;
  }

  async removeBalance(userId, amount) {
    let userData = await this.getPlayer(userId);
    if (userData.balance < amount) {
      throw new Error("Insufficient balance");
    }
    userData.balance -= amount;
    await this.updatePlayer(userId, userData);
    return userData.balance;
  }

  async transferBalance(fromUserId, toUserId, amount) {
    let fromData = await this.getPlayer(fromUserId);
    let toData = await this.getPlayer(toUserId);
    if (fromData.balance < amount) {
      throw new Error("Insufficient balance");
    }
    fromData.balance -= amount;
    toData.balance = (toData.balance || 0) + amount;
    await this.updatePlayer(fromUserId, fromData);
    await this.updatePlayer(toUserId, toData);
    return { fromBalance: fromData.balance, toBalance: toData.balance };
  }

  async getLeaderboard(limit = 5) {
    let leaderboard = [];
    if (this.db) {
      try {
        leaderboard = await this.db.db("users").find({ "data.registered": true }).toArray();
        leaderboard = leaderboard
          .map(doc => ({
            userId: doc.userId,
            balance: doc.data.balance || 0
          }))
          .sort((a, b) => b.balance - a.balance)
          .slice(0, limit);
      } catch (error) {
        console.warn(`[RPGManager] Leaderboard fetch failed: ${error.message}`);
      }
    } else {
      leaderboard = Array.from(this.usersData.entries())
        .filter(([_, data]) => data.registered)
        .map(([userId, data]) => ({ userId, balance: data.balance || 0 }))
        .sort((a, b) => b.balance - a.balance)
        .slice(0, limit);
    }
    return leaderboard;
  }
}
module.exports = {
  name: "rpg",
  description: "Manage your RPG character with #rpg <subcommand>",
  usage: "#rpg register",
  async run({ api, event, args, db, usersData }) {
    const { threadID, messageID, senderID } = event;

    if (!usersData) {
      console.error("[RPG] usersData is undefined");
      return api.sendMessage(
        format({
          title: "RPG",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          emojis: "🏹",
          content: `Internal error: Data cache not initialized. Contact bot admin.`
        }),
        threadID,
        messageID
      );
    }

    const rpgManager = new RPGManager(db, usersData);
    const subcommand = args[0]?.toLowerCase();
    const player = await rpgManager.getPlayer(senderID);

    if (subcommand !== "register" && !player.registered) {
      return api.sendMessage(
        format({
          title: "RPG",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          emojis: "🏹",
          content: `You're not registered!\nUse #rpg register`
        }),
        threadID,
        messageID
      );
    }

    switch (subcommand) {
      case "register":
        const result = await rpgManager.registerPlayer(senderID);
        if (!result.success) {
          return api.sendMessage(
            format({
              title: "RPG",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🏹",
              content: `${result.error}`
            }),
            threadID,
            messageID
          );
        }
        return api.sendMessage(
          format({
            title: "RPG",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏹",
            content: `Registered! Start with #rpg battle or #rpg shop`
          }),
          threadID,
          messageID
        );

      case "stats":
        return api.sendMessage(
          format({
            title: "Stats",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📊",
            content: `Level: ${Math.floor(player.exp / 100) || 1}\nExperience: ${player.exp} XP\nBalance: $${player.balance.toLocaleString()}`
          }),
          threadID,
          messageID
        );

      case "earn":
        const earnAmount = Math.floor(Math.random() * 50) + 10;
        await rpgManager.addBalance(senderID, earnAmount);
        return api.sendMessage(
          format({
            title: "Earn",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💰",
            content: `You earned $${earnAmount.toLocaleString()}! New balance: $${((player.balance || 0) + earnAmount).toLocaleString()}`
          }),
          threadID,
          messageID
        );

      case "level":
        const level = Math.floor(player.exp / 100) || 1;
        const requiredExp = level * 100;
        return api.sendMessage(
          format({
            title: "Level",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📈",
            content: `Level: ${level}\nExperience: ${player.exp} XP\nRequired for next level: ${requiredExp - player.exp} XP`
          }),
          threadID,
          messageID
        );

      case "battle":
        const enemies = [
          { name: "Goblin", health: 50, strength: 10, exp: Math.floor(Math.random() * 20) + 20, loot: "Health Potion" },
          { name: "Wolf", health: 70, strength: 15, exp: Math.floor(Math.random() * 30) + 30, loot: "Wolf Pelt" },
          { name: "Troll", health: 100, strength: 20, exp: Math.floor(Math.random() * 40) + 40, loot: "Troll Club" }
        ];
        const enemy = enemies[Math.floor(Math.random() * enemies.length)];
        const playerStrength = (Math.floor(player.exp / 100) || 1) * 10;
        const battleChance = Math.random() * (playerStrength / (playerStrength + enemy.strength));
        if (battleChance > 0.3) {
          player.inventory[enemy.loot] = (player.inventory[enemy.loot] || 0) + 1;
          await rpgManager.updatePlayer(senderID, {
            exp: (player.exp || 0) + enemy.exp,
            inventory: player.inventory
          });
          return api.sendMessage(
            format({
              title: "Battle",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🗡️",
              content: `You defeated a ${enemy.name}! Gained ${enemy.exp} XP and ${enemy.loot} x1. New XP: ${(player.exp || 0) + enemy.exp}`
            }),
            threadID,
            messageID
          );
        }
        return api.sendMessage(
          format({
            title: "Battle",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🛡️",
            content: `You were defeated by a ${enemy.name}! Try again later.`
          }),
          threadID,
          messageID
        );

      case "inventory":
        return api.sendMessage(
          format({
            title: "Inventory",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🎒",
            content: Object.keys(player.inventory).length > 0
              ? `Items: ${Object.entries(player.inventory).map(([item, qty]) => `${item}: ${qty}`).join(", ")}`
              : "Your inventory is empty!"
          }),
          threadID,
          messageID
        );

      case "shop":
        return api.sendMessage(
          format({
            title: "Shop",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏪",
            content: `Available items:\n- Sword ($200)\n- Shield ($150)\n- Health Potion ($50)\nUse: #rpg buy <item>`
          }),
          threadID,
          messageID
        );

      case "buy":
        const item = args[1]?.toLowerCase();
        const items = { sword: 200, shield: 150, "health potion": 50 };
        if (!item || !items[item]) {
          return api.sendMessage(
            format({
              title: "Buy",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Invalid item! Available: ${Object.keys(items).join(", ")}`
            }),
            threadID,
            messageID
          );
        }
        if (player.balance < items[item]) {
          return api.sendMessage(
            format({
              title: "Buy",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `You need $${items[item]} to buy ${item}!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory[item] = (player.inventory[item] || 0) + 1;
        await rpgManager.removeBalance(senderID, items[item]);
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Buy",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "✅",
            content: `You bought a ${item} for $${items[item]}!`
          }),
          threadID,
          messageID
        );
         case "quest":
        const questReward = Math.floor(Math.random() * 100) + 50;
        await rpgManager.updatePlayer(senderID, {
          balance: (player.balance || 0) + questReward,
          exp: (player.exp || 0) + 20
        });
        return api.sendMessage(
          format({
            title: "Quest",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📜",
            content: `You completed a quest! Earned $${questReward} and 20 XP.`
          }),
          threadID,
          messageID
        );

      case "train":
        const trainExp = Math.floor(Math.random() * 15) + 10;
        await rpgManager.updatePlayer(senderID, {
          exp: (player.exp || 0) + trainExp
        });
        return api.sendMessage(
          format({
            title: "Train",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💪",
            content: `You trained and gained ${trainExp} XP! New XP: ${(player.exp || 0) + trainExp}`
          }),
          threadID,
          messageID
        );

      case "heal":
        if (!player.inventory["health potion"]) {
          return api.sendMessage(
            format({
              title: "Heal",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `You need a Health Potion to heal!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["health potion"] -= 1;
        if (player.inventory["health potion"] === 0) {
          delete player.inventory["health potion"];
        }
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Heal",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🩺",
            content: `You used a Health Potion to heal!`
          }),
          threadID,
          messageID
        );

      case "upgrade":
        const upgradeCost = (Math.floor(player.exp / 100) || 1) * 50;
        if (player.balance < upgradeCost) {
          return api.sendMessage(
            format({
              title: "Upgrade",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `You need $${upgradeCost} to upgrade!`
            }),
            threadID,
            messageID
          );
        }
        await rpgManager.removeBalance(senderID, upgradeCost);
        await rpgManager.updatePlayer(senderID, {
          exp: (player.exp || 0) + 50
        });
        return api.sendMessage(
          format({
            title: "Upgrade",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📈",
            content: `You upgraded your skills for $${upgradeCost}! Gained 50 XP.`
          }),
          threadID,
          messageID
        );

      case "gift":
        const giftAmount = parseInt(args[1]);
        const targetID = args[2];
        if (!giftAmount || giftAmount <= 0 || !targetID) {
          return api.sendMessage(
            format({
              title: "Gift",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Usage: #rpg gift <amount> <userID>`
            }),
            threadID,
            messageID
          );
        }
        if (player.balance < giftAmount) {
          return api.sendMessage(
            format({
              title: "Gift",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `You need $${giftAmount} to gift!`
            }),
            threadID,
            messageID
          );
        }
        await rpgManager.transferBalance(senderID, targetID, giftAmount);
        return api.sendMessage(
          format({
            title: "Gift",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🎁",
            content: `You gifted $${giftAmount} to user ${targetID}!`
          }),
          threadID,
          messageID
        );

      case "leaderboard":
        const leaderboard = await rpgManager.getLeaderboard(5);
        return api.sendMessage(
          format({
            title: "Leaderboard",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏆",
            content: leaderboard.length > 0
              ? leaderboard.map((entry, i) => `${i + 1}. User ${entry.userId}: $${entry.balance.toLocaleString()}`).join("\n")
              : "No players on the leaderboard!"
          }),
          threadID,
          messageID
        );

      case "reset":
        await rpgManager.updatePlayer(senderID, { balance: 0, exp: 0, inventory: {}, registered: true });
        return api.sendMessage(
          format({
            title: "Reset",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🔄",
            content: `Your stats have been reset!`
          }),
          threadID,
          messageID
        );

      case "trade":
        const tradeItem = args[1]?.toLowerCase();
        const tradeQuantity = parseInt(args[2]) || 1;
        const tradeTargetID = args[3];
        if (!tradeItem || !player.inventory[tradeItem] || tradeQuantity <= 0 || !tradeTargetID) {
          return api.sendMessage(
            format({
              title: "Trade",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Usage: #rpg trade <item> <quantity> <userID>`
            }),
            threadID,
            messageID
          );
        }
        if (player.inventory[tradeItem] < tradeQuantity) {
          return api.sendMessage(
            format({
              title: "Trade",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `You don't have enough ${tradeItem}!`
            }),
            threadID,
            messageID
          );
        }
        const targetData = await rpgManager.getPlayer(tradeTargetID);
        if (!targetData.registered) {
          return api.sendMessage(
            format({
              title: "Trade",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Target user is not registered!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory[tradeItem] -= tradeQuantity;
        if (player.inventory[tradeItem] === 0) {
          delete player.inventory[tradeItem];
        }
        targetData.inventory[tradeItem] = (targetData.inventory[tradeItem] || 0) + tradeQuantity;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        await rpgManager.updatePlayer(tradeTargetID, { inventory: targetData.inventory });
        return api.sendMessage(
          format({
            title: "Trade",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🤝",
            content: `You traded ${tradeItem} x${tradeQuantity} to user ${tradeTargetID}!`
          }),
          threadID,
          messageID
        );
      case "explore":
        const exploreExp = Math.floor(Math.random() * 30) + 10;
        const lootChance = Math.random();
        let exploreContent = `You explored and gained ${exploreExp} XP! New XP: ${(player.exp || 0) + exploreExp}`;
        if (lootChance > 0.4) {
          const loot = ["Gold Coin", "Gem"][Math.floor(Math.random() * 2)];
          player.inventory[loot] = (player.inventory[loot] || 0) + 1;
          exploreContent += `\nFound ${loot} x1!`;
          await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + exploreExp, inventory: player.inventory });
        }
        return api.sendMessage(
          format({
            title: "Explore",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🗺️",
            content: exploreContent
          }),
          threadID,
          messageID
        );

      case "fish":
        const fishExp = 15;
        const fishLootChance = Math.random();
        let fishContent = `You fished and gained ${fishExp} XP! New XP: ${(player.exp || 0) + fishExp}`;
        if (fishLootChance > 0.6) {
          player.inventory["Fish"] = (player.inventory["Fish"] || 0) + 1;
          fishContent += `\nCaught a Fish x1!`;
          await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + fishExp, inventory: player.inventory });
        }
        return api.sendMessage(
          format({
            title: "Fish",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🎣",
            content: fishContent
          }),
          threadID,
          messageID
        );

      case "mine":
        const mineExp = 20;
        const mineLootChance = Math.random();
        let mineContent = `You mined and gained ${mineExp} XP! New XP: ${(player.exp || 0) + mineExp}`;
        if (mineLootChance > 0.5) {
          player.inventory["Ore"] = (player.inventory["Ore"] || 0) + 1;
          mineContent += `\nMined an Ore x1!`;
          await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + mineExp, inventory: player.inventory });
        }
        return api.sendMessage(
          format({
            title: "Mine",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⛏️",
            content: mineContent
          }),
          threadID,
          messageID
        );
       case "craft":
        const recipes = { "Iron Sword": { materials: { "Ore": 2 }, cost: 50 } };
        const craftItem = args[1]?.toLowerCase();
        if (!craftItem || !recipes[craftItem]) {
          return api.sendMessage(
            format({
              title: "Craft",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🔨",
              content: `Available: ${Object.keys(recipes).join(", ")}\nUse: #rpg craft <item>`
            }),
            threadID,
            messageID
          );
        }
        if (player.inventory[recipes[craftItem].materials["Ore"]] < 2 || player.balance < recipes[craftItem].cost) {
          return api.sendMessage(
            format({
              title: "Craft",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 2 Ore and $${recipes[craftItem].cost}!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Ore"] -= 2;
        player.inventory[craftItem] = (player.inventory[craftItem] || 0) + 1;
        await rpgManager.removeBalance(senderID, recipes[craftItem].cost);
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Craft",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "✅",
            content: `Crafted ${craftItem}!`
          }),
          threadID,
          messageID
        );

      case "sell":
        const sellItem = args[1]?.toLowerCase();
        if (!sellItem || !player.inventory[sellItem]) {
          return api.sendMessage(
            format({
              title: "Sell",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "💸",
              content: `Use: #rpg sell <item>`
            }),
            threadID,
            messageID
          );
        }
        const sellValue = Math.floor({ "sword": 150, "shield": 100, "health potion": 30, "fish": 10, "ore": 20, "gold coin": 50, "gem": 75 }[sellItem] * 0.8) || 5;
        player.inventory[sellItem] -= 1;
        if (player.inventory[sellItem] === 0) delete player.inventory[sellItem];
        await rpgManager.addBalance(senderID, sellValue);
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Sell",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💰",
            content: `Sold ${sellItem} for $${sellValue}!`
          }),
          threadID,
          messageID
        );

      case "pet":
        const petType = args[1]?.toLowerCase();
        const petCosts = { dog: 50, cat: 30, dragon: 200 };
        if (!petType || !petCosts[petType]) {
          return api.sendMessage(
            format({
              title: "Pet",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🐾",
              content: `Available: ${Object.keys(petCosts).join(", ")}\nUse: #rpg pet <type>`
            }),
            threadID,
            messageID
          );
        }
        if (player.balance < petCosts[petType]) {
          return api.sendMessage(
            format({
              title: "Pet",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need $${petCosts[petType]}!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory[`${petType} Pet`] = (player.inventory[`${petType} Pet`] || 0) + 1;
        await rpgManager.removeBalance(senderID, petCosts[petType]);
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Pet",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "✅",
            content: `Bought a ${petType} Pet for $${petCosts[petType]}!`
          }),
          threadID,
          messageID
        );

      case "feed":
        if (!player.inventory["Fish"] && !player.inventory["Ore"]) {
          return api.sendMessage(
            format({
              title: "Feed",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need Fish or Ore to feed your pet!`
            }),
            threadID,
            messageID
          );
        }
        const feedItem = player.inventory["Fish"] ? "Fish" : "Ore";
        player.inventory[feedItem] -= 1;
        if (player.inventory[feedItem] === 0) delete player.inventory[feedItem];
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Feed",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🍖",
            content: `Fed your pet with ${feedItem}!`
          }),
          threadID,
          messageID
        );

      case "guild":
        if (!args[1]) {
          return api.sendMessage(
            format({
              title: "Guild",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🏰",
              content: `Join a guild: #rpg guild <name>`
            }),
            threadID,
            messageID
          );
        }
        player.guild = args.slice(1).join(" ");
        await rpgManager.updatePlayer(senderID, { guild: player.guild });
        return api.sendMessage(
          format({
            title: "Guild",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "✅",
            content: `Joined guild: ${player.guild}`
          }),
          threadID,
          messageID
        );

      case "arena":
        const opponentID = args[1];
        if (!opponentID) {
          return api.sendMessage(
            format({
              title: "Arena",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "⚔️",
              content: `Challenge: #rpg arena <userID>`
            }),
            threadID,
            messageID
          );
        }
        const opponent = await rpgManager.getPlayer(opponentID);
        if (!opponent.registered) {
          return api.sendMessage(
            format({
              title: "Arena",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Opponent not registered!`
            }),
            threadID,
            messageID
          );
        }
        const arenaChance = Math.random();
        if (arenaChance > 0.5) {
          const arenaReward = Math.floor(Math.random() * 100) + 50;
          await rpgManager.addBalance(senderID, arenaReward);
          return api.sendMessage(
            format({
              title: "Arena",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🏆",
              content: `Won against ${opponentID}! Earned $${arenaReward}.`
            }),
            threadID,
            messageID
          );
        }
        return api.sendMessage(
          format({
            title: "Arena",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💥",
            content: `Lost to ${opponentID}!`
          }),
          threadID,
          messageID
        );

      case "tournament":
        const tourReward = Math.floor(Math.random() * 200) + 100;
        await rpgManager.addBalance(senderID, tourReward);
        return api.sendMessage(
          format({
            title: "Tournament",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏟️",
            content: `Won tournament! Earned $${tourReward}.`
          }),
          threadID,
          messageID
        );

      case "rest":
        const restExp = Math.floor(Math.random() * 10) + 5;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + restExp });
        return api.sendMessage(
          format({
            title: "Rest",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "😴",
            content: `Rested and gained ${restExp} XP!`
          }),
          threadID,
          messageID
        );

      case "journey":
        const journeyExp = Math.floor(Math.random() * 50) + 25;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + journeyExp });
        return api.sendMessage(
          format({
            title: "Journey",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🌍",
            content: `Completed journey! Gained ${journeyExp} XP.`
          }),
          threadID,
          messageID
        );

      case "hunt":
        const huntExp = Math.floor(Math.random() * 40) + 15;
        const huntLootChance = Math.random();
        let huntContent = `You hunted and gained ${huntExp} XP! New XP: ${(player.exp || 0) + huntExp}`;
        if (huntLootChance > 0.5) {
          player.inventory["Deer Hide"] = (player.inventory["Deer Hide"] || 0) + 1;
          huntContent += `\nFound Deer Hide x1!`;
          await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + huntExp, inventory: player.inventory });
        }
        return api.sendMessage(
          format({
            title: "Hunt",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏹",
            content: huntContent
          }),
          threadID,
          messageID
        );

      case "forge":
        if (player.inventory["Ore"] < 3) {
          return api.sendMessage(
            format({
              title: "Forge",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 3 Ore to forge!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Ore"] -= 3;
        player.inventory["Steel Blade"] = (player.inventory["Steel Blade"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Forge",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🔥",
            content: `Forged a Steel Blade!`
          }),
          threadID,
          messageID
        );

      case "alchemy":
        if (player.inventory["Gem"] < 1 || player.inventory["Health Potion"] < 2) {
          return api.sendMessage(
            format({
              title: "Alchemy",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 1 Gem and 2 Health Potions!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Gem"] -= 1;
        player.inventory["Health Potion"] -= 2;
        player.inventory["Elixir"] = (player.inventory["Elixir"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Alchemy",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⚗️",
            content: `Crafted an Elixir!`
          }),
          threadID,
          messageID
        );

      case "tame":
        if (player.inventory["Deer Hide"] < 1) {
          return api.sendMessage(
            format({
              title: "Tame",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 1 Deer Hide to tame!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Deer Hide"] -= 1;
        player.inventory["Tamed Deer"] = (player.inventory["Tamed Deer"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Tame",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🐴",
            content: `Tamed a Deer!`
          }),
          threadID,
          messageID
        );
case "ride":
        if (!player.inventory["Tamed Deer"] && !player.inventory["dragon Pet"]) {
          return api.sendMessage(
            format({
              title: "Ride",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need a Tamed Deer or Dragon Pet!`
            }),
            threadID,
            messageID
          );
        }
        const rideExp = 30;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + rideExp });
        return api.sendMessage(
          format({
            title: "Ride",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏇",
            content: `Rode your mount! Gained ${rideExp} XP.`
          }),
          threadID,
          messageID
        );

      case "camp":
        const campExp = 15;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + campExp });
        return api.sendMessage(
          format({
            title: "Camp",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⛺",
            content: `Camped and gained ${campExp} XP!`
          }),
          threadID,
          messageID
        );

      case "scout":
        const scoutExp = Math.floor(Math.random() * 25) + 10;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + scoutExp });
        return api.sendMessage(
          format({
            title: "Scout",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🔭",
            content: `Scouted the area! Gained ${scoutExp} XP.`
          }),
          threadID,
          messageID
        );

      case "gather":
        const gatherExp = 10;
        player.inventory["Herb"] = (player.inventory["Herb"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + gatherExp, inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Gather",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🌿",
            content: `Gathered Herbs! Gained ${gatherExp} XP.`
          }),
          threadID,
          messageID
        );

      case "build":
        if (player.inventory["Wood"] < 5) {
          return api.sendMessage(
            format({
              title: "Build",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 5 Wood to build!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Wood"] -= 5;
        player.inventory["House"] = (player.inventory["House"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Build",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏠",
            content: `Built a House!`
          }),
          threadID,
          messageID
        );

      case "tradeup":
        if (player.inventory["Gold Coin"] < 10) {
          return api.sendMessage(
            format({
              title: "TradeUp",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 10 Gold Coins!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Gold Coin"] -= 10;
        player.inventory["Ruby"] = (player.inventory["Ruby"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "TradeUp",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💎",
            content: `Traded for a Ruby!`
          }),
          threadID,
          messageID
        );

      case "enchant":
        if (player.inventory["Elixir"] < 1 || player.inventory["Sword"] < 1) {
          return api.sendMessage(
            format({
              title: "Enchant",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 1 Elixir and 1 Sword!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Elixir"] -= 1;
        player.inventory["Sword"] -= 1;
        player.inventory["Enchanted Sword"] = (player.inventory["Enchanted Sword"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Enchant",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "✨",
            content: `Enchanted a Sword!`
          }),
          threadID,
          messageID
        );

      case "questlist":
        return api.sendMessage(
          format({
            title: "QuestList",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📜",
            content: `Quests: Hunt, Gather, Explore\nUse: #rpg quest`
          }),
          threadID,
          messageID
        );

      case "profile":
        return api.sendMessage(
          format({
            title: "Profile",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "👤",
            content: `Level: ${Math.floor(player.exp / 100) || 1}\nBalance: $${player.balance.toLocaleString()}\nGuild: ${player.guild || "None"}`
          }),
          threadID,
          messageID
        );

      case "event":
        const eventReward = Math.floor(Math.random() * 150) + 50;
        await rpgManager.addBalance(senderID, eventReward);
        return api.sendMessage(
          format({
            title: "Event",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🎉",
            content: `Won event! Earned $${eventReward}.`
          }),
          threadID,
          messageID
        );

      case "duel":
        const duelOpponent = args[1];
        if (!duelOpponent) {
          return api.sendMessage(
            format({
              title: "Duel",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "⚔️",
              content: `Duel: #rpg duel <userID>`
            }),
            threadID,
            messageID
          );
        }
        const duelChance = Math.random();
        if (duelChance > 0.5) {
          const duelReward = 75;
          await rpgManager.addBalance(senderID, duelReward);
          return api.sendMessage(
            format({
              title: "Duel",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🏆",
              content: `Won duel vs ${duelOpponent}! Earned $${duelReward}.`
            }),
            threadID,
            messageID
          );
        }
        return api.sendMessage(
          format({
            title: "Duel",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💥",
            content: `Lost duel vs ${duelOpponent}!`
          }),
          threadID,
          messageID
        );

      case "bounty":
        const bountyReward = Math.floor(Math.random() * 300) + 100;
        await rpgManager.addBalance(senderID, bountyReward);
        return api.sendMessage(
          format({
            title: "Bounty",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🔫",
            content: `Completed bounty! Earned $${bountyReward}.`
          }),
          threadID,
          messageID
        );

      case "steal":
        const stealTarget = args[1];
        if (!stealTarget) {
          return api.sendMessage(
            format({
              title: "Steal",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Steal: #rpg steal <userID>`
            }),
            threadID,
            messageID
          );
        }
        const stealChance = Math.random();
        if (stealChance > 0.7) {
          const stealAmount = Math.floor(Math.random() * 50) + 10;
          await rpgManager.transferBalance(stealTarget, senderID, stealAmount);
          return api.sendMessage(
            format({
              title: "Steal",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "💰",
              content: `Stole $${stealAmount} from ${stealTarget}!`
            }),
            threadID,
            messageID
          );
        }
        return api.sendMessage(
          format({
            title: "Steal",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🚨",
            content: `Failed to steal from ${stealTarget}!`
          }),
          threadID,
          messageID
        );

      case "raid":
        const raidReward = Math.floor(Math.random() * 400) + 200;
        await rpgManager.addBalance(senderID, raidReward);
        return api.sendMessage(
          format({
            title: "Raid",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💣",
            content: `Raided successfully! Earned $${raidReward}.`
          }),
          threadID,
          messageID
        );

      case "defend":
        const defendExp = 25;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + defendExp });
        return api.sendMessage(
          format({
            title: "Defend",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🛡️",
            content: `Defended your base! Gained ${defendExp} XP.`
          }),
          threadID,
          messageID
        );

      case "repair":
        if (player.inventory["Ore"] < 2) {
          return api.sendMessage(
            format({
              title: "Repair",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 2 Ore to repair!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Ore"] -= 2;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Repair",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🔧",
            content: `Repaired your gear!`
          }),
          threadID,
          messageID
        );

      case "upgradeweapon":
        if (player.inventory["Steel Blade"] < 1) {
          return api.sendMessage(
            format({
              title: "UpgradeWeapon",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 1 Steel Blade!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Steel Blade"] -= 1;
        player.inventory["Upgraded Blade"] = (player.inventory["Upgraded Blade"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "UpgradeWeapon",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⚔️",
            content: `Upgraded to Upgraded Blade!`
          }),
          threadID,
          messageID
        );

      case "summon":
        if (player.inventory["Ruby"] < 1) {
          return api.sendMessage(
            format({
              title: "Summon",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 1 Ruby to summon!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Ruby"] -= 1;
        player.inventory["Summoned Spirit"] = (player.inventory["Summoned Spirit"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Summon",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "👻",
            content: `Summoned a Spirit!`
          }),
          threadID,
          messageID
        );
case "harvest":
        const harvestExp = 12;
        player.inventory["Wheat"] = (player.inventory["Wheat"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + harvestExp, inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Harvest",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🌾",
            content: `Harvested Wheat! Gained ${harvestExp} XP.`
          }),
          threadID,
          messageID
        );

      case "cook":
        if (player.inventory["Wheat"] < 2 || player.inventory["Fish"] < 1) {
          return api.sendMessage(
            format({
              title: "Cook",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 2 Wheat and 1 Fish!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Wheat"] -= 2;
        player.inventory["Fish"] -= 1;
        player.inventory["Cooked Meal"] = (player.inventory["Cooked Meal"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Cook",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🍲",
            content: `Cooked a Meal!`
          }),
          threadID,
          messageID
        );

      case "tradeall":
        const tradeAllTarget = args[1];
        if (!tradeAllTarget) {
          return api.sendMessage(
            format({
              title: "TradeAll",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Trade all: #rpg tradeall <userID>`
            }),
            threadID,
            messageID
          );
        }
        const targetAllData = await rpgManager.getPlayer(tradeAllTarget);
        if (!targetAllData.registered) {
          return api.sendMessage(
            format({
              title: "TradeAll",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Target not registered!`
            }),
            threadID,
            messageID
          );
        }
        for (let item in player.inventory) {
          targetAllData.inventory[item] = (targetAllData.inventory[item] || 0) + player.inventory[item];
          delete player.inventory[item];
        }
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        await rpgManager.updatePlayer(tradeAllTarget, { inventory: targetAllData.inventory });
        return api.sendMessage(
          format({
            title: "TradeAll",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🤝",
            content: `Traded all items to ${tradeAllTarget}!`
          }),
          threadID,
          messageID
        );

      case "auction":
        if (Object.keys(player.inventory).length === 0) {
          return api.sendMessage(
            format({
              title: "Auction",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `No items to auction!`
            }),
            threadID,
            messageID
          );
        }
        const auctionItem = Object.keys(player.inventory)[0];
        const auctionValue = Math.floor({ "sword": 150, "shield": 100, "health potion": 30, "fish": 10, "ore": 20, "gold coin": 50, "gem": 75 }[auctionItem] * 1.2) || 5;
        delete player.inventory[auctionItem];
        await rpgManager.addBalance(senderID, auctionValue);
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Auction",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📢",
            content: `Auctioned ${auctionItem} for $${auctionValue}!`
          }),
          threadID,
          messageID
        );

      case "meditate":
        const meditateExp = Math.floor(Math.random() * 20) + 10;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + meditateExp });
        return api.sendMessage(
          format({
            title: "Meditate",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🧘",
            content: `Meditated! Gained ${meditateExp} XP.`
          }),
          threadID,
          messageID
        );

      case "bargain":
        const bargainTarget = args[1];
        if (!bargainTarget) {
          return api.sendMessage(
            format({
              title: "Bargain",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Bargain: #rpg bargain <userID>`
            }),
            threadID,
            messageID
          );
        }
        const bargainChance = Math.random();
        if (bargainChance > 0.6) {
          const bargainAmount = Math.floor(Math.random() * 30) + 10;
          await rpgManager.transferBalance(bargainTarget, senderID, bargainAmount);
          return api.sendMessage(
            format({
              title: "Bargain",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "💬",
              content: `Bargained $${bargainAmount} from ${bargainTarget}!`
            }),
            threadID,
            messageID
          );
        }
        return api.sendMessage(
          format({
            title: "Bargain",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "❌",
            content: `Failed to bargain with ${bargainTarget}!`
          }),
          threadID,
          messageID
        );

      case "sacrifice":
        if (player.inventory["Gem"] < 3) {
          return api.sendMessage(
            format({
              title: "Sacrifice",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 3 Gems to sacrifice!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Gem"] -= 3;
        const sacrificeExp = 100;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + sacrificeExp, inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Sacrifice",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🙏",
            content: `Sacrificed 3 Gems! Gained ${sacrificeExp} XP.`
          }),
          threadID,
          messageID
        );

      case "exploredeep":
        const deepExp = Math.floor(Math.random() * 50) + 25;
        const deepLootChance = Math.random();
        let deepContent = `Explored deep! Gained ${deepExp} XP. New XP: ${(player.exp || 0) + deepExp}`;
        if (deepLootChance > 0.3) {
          player.inventory["Rare Crystal"] = (player.inventory["Rare Crystal"] || 0) + 1;
          deepContent += `\nFound Rare Crystal x1!`;
          await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + deepExp, inventory: player.inventory });
        }
        return api.sendMessage(
          format({
            title: "ExploreDeep",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🌌",
            content: deepContent
          }),
          threadID,
          messageID
        );

      case "trainhard":
        const hardExp = Math.floor(Math.random() * 30) + 20;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + hardExp });
        return api.sendMessage(
          format({
            title: "TrainHard",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💪",
            content: `Trained hard! Gained ${hardExp} XP.`
          }),
          threadID,
          messageID
        );

      case "questelite":
        const eliteReward = Math.floor(Math.random() * 250) + 100;
        await rpgManager.addBalance(senderID, eliteReward);
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + 50 });
        return api.sendMessage(
          format({
            title: "QuestElite",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🌟",
            content: `Completed elite quest! Earned $${eliteReward} and 50 XP.`
          }),
          threadID,
          messageID
        );

      case "guildwar":
        const warReward = Math.floor(Math.random() * 300) + 150;
        await rpgManager.addBalance(senderID, warReward);
        return api.sendMessage(
          format({
            title: "GuildWar",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "⚔️",
            content: `Won guild war! Earned $${warReward}.`
          }),
          threadID,
          messageID
        );

      case "collect":
        const collectExp = 15;
        player.inventory["Coin"] = (player.inventory["Coin"] || 0) + 1;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + collectExp, inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Collect",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "💰",
            content: `Collected a Coin! Gained ${collectExp} XP.`
          }),
          threadID,
          messageID
        );

      case "barter":
        const barterItem = args[1]?.toLowerCase();
        if (!barterItem || !player.inventory[barterItem]) {
          return api.sendMessage(
            format({
              title: "Barter",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Barter: #rpg barter <item>`
            }),
            threadID,
            messageID
          );
        }
        const barterValue = Math.floor({ "sword": 150, "shield": 100, "health potion": 30 }[barterItem] * 0.9) || 5;
        player.inventory[barterItem] -= 1;
        if (player.inventory[barterItem] === 0) delete player.inventory[barterItem];
        await rpgManager.addBalance(senderID, barterValue);
        await rpgManager.updatePlayer(senderID, { inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Barter",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🤝",
            content: `Bartered ${barterItem} for $${barterValue}!`
          }),
          threadID,
          messageID
        );

      case "questdaily":
        const dailyReward = Math.floor(Math.random() * 100) + 40;
        await rpgManager.addBalance(senderID, dailyReward);
        return api.sendMessage(
          format({
            title: "QuestDaily",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "📅",
            content: `Completed daily quest! Earned $${dailyReward}.`
          }),
          threadID,
          messageID
        );

      case "adventure":
        const adventureExp = Math.floor(Math.random() * 60) + 30;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + adventureExp });
        return api.sendMessage(
          format({
            title: "Adventure",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🌄",
            content: `Went on adventure! Gained ${adventureExp} XP.`
          }),
          threadID,
          messageID
        );

      case "treasure":
        const treasureChance = Math.random();
        let treasureContent = `Searched for treasure!`;
        if (treasureChance > 0.4) {
          const treasureReward = Math.floor(Math.random() * 200) + 100;
          await rpgManager.addBalance(senderID, treasureReward);
          treasureContent += `\nFound $${treasureReward}!`;
        }
        return api.sendMessage(
          format({
            title: "Treasure",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏴‍☠️",
            content: treasureContent
          }),
          threadID,
          messageID
        );

      case "bless":
        if (player.inventory["Elixir"] < 1) {
          return api.sendMessage(
            format({
              title: "Bless",
              titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
              titleFont: "double_struck",
              emojis: "🚫",
              content: `Need 1 Elixir to bless!`
            }),
            threadID,
            messageID
          );
        }
        player.inventory["Elixir"] -= 1;
        const blessExp = 40;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + blessExp, inventory: player.inventory });
        return api.sendMessage(
          format({
            title: "Bless",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🙌",
            content: `Blessed yourself! Gained ${blessExp} XP.`
          }),
          threadID,
          messageID
        );
      case "challenge":
        const challengeReward = Math.floor(Math.random() * 150) + 75;
        await rpgManager.addBalance(senderID, challengeReward);
        return api.sendMessage(
          format({
            title: "Challenge",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🎯",
            content: `Completed challenge! Earned $${challengeReward}.`
          }),
          threadID,
          messageID
        );

      case "guard":
        const guardExp = 20;
        await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + guardExp });
        return api.sendMessage(
          format({
            title: "Guard",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🛡️",
            content: `Guarded the village! Gained ${guardExp} XP.`
          }),
          threadID,
          messageID
        );

      case "explorecave":
        const caveExp = Math.floor(Math.random() * 40) + 20;
        const caveLootChance = Math.random();
        let caveContent = `Explored cave! Gained ${caveExp} XP. New XP: ${(player.exp || 0) + caveExp}`;
        if (caveLootChance > 0.35) {
          player.inventory["Cave Gem"] = (player.inventory["Cave Gem"] || 0) + 1;
          caveContent += `\nFound Cave Gem x1!`;
          await rpgManager.updatePlayer(senderID, { exp: (player.exp || 0) + caveExp, inventory: player.inventory });
        }
        return api.sendMessage(
          format({
            title: "ExploreCave",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🕳️",
            content: caveContent
          }),
          threadID,
          messageID
        );

      default:
        return api.sendMessage(
          format({
            title: "RPG",
            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
            titleFont: "double_struck",
            emojis: "🏹",
            content: `**Available commands**:\n- **rpg** register\n- **rpg** stats\n- **rpg** earn\n- **rpg** level\n- **rpg** battle\n- **rpg** inventory\n- **rpg** shop\n- **rpg** buy <item>\n- **rpg** quest\n- **rpg** train\n- **rpg** heal\n- **rpg** upgrade\n- **rpg** gift <amount> <userID>\n- **rpg** leaderboard\n- **rpg** reset\n- **rpg** trade <item> <quantity> <userID>\n- **rpg** explore\n- **rpg** fish\n- **rpg** mine\n- **rpg** craft <item>\n- **rpg** sell <item>\n- **rpg** pet <type>\n- **rpg** feed\n- **rpg** guild <name>\n- **rpg** arena <userID>\n- **rpg** tournament\n- **rpg** rest\n- **rpg** journey\n- **rpg** hunt\n- **rpg** forge\n- **rpg** alchemy\n- **rpg** tame\n- **rpg** ride\n- **rpg** camp\n- **rpg** scout\n- **rpg** gather\n- **rpg** build\n- **rpg** tradeup\n- **rpg** enchant\n- **rpg** questlist\n- **rpg** profile\n- **rpg** event\n- **rpg** duel <userID>\n- **rpg** bounty\n- **rpg** steal <userID>\n- **rpg** raid\n- **rpg** defend\n- **rpg** repair\n- **rpg** upgradeweapon\n- **rpg** summon\n- **rpg** harvest\n- **rpg** cook\n- **rpg** tradeall <userID>\n- **rpg** auction\n- **rpg** meditate\n- **rpg** bargain <userID>\n- **rpg** sacrifice\n- **rpg** exploredeep\n- **rpg** trainhard\n- **rpg** questelite\n- **rpg** guildwar\n- **rpg** collect\n- **rpg** barter <item>\n- **rpg** questdaily\n- **rpg** adventure\n- **rpg** treasure\n- **rpg** bless\n- **rpg** challenge\n- **rpg** guard\n- **rpg** explorecave`
          }),
          threadID,
          messageID
        );
    }
  }
};
      

