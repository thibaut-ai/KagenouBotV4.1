const { format, UNIRedux } = require("cassidy-styler");

class AdventureManager {

  constructor(db, usersData) {

    this.db = db;

    this.usersData = usersData;

  }

  async getAdventurer(userId) {

    let userData = this.usersData.get(userId) || {};

    if (this.db) {

      try {

        const userDoc = await this.db.db("users").findOne({ userId });

        userData = userDoc?.data || {};

      } catch (error) {

        console.warn(`[AdventureManager] DB access failed for user ${userId}: ${error.message}`);

      }

    }

    if (!userData.adventure) userData.adventure = { inventory: {}, cooldowns: {} };

    return userData;

  }

  async registerAdventurer(userId, name) {

    let userData = this.usersData.get(userId) || {};

    if (this.db) {

      try {

        const userDoc = await this.db.db("users").findOne({ userId });

        userData = userDoc?.data || {};

      } catch (error) {

        console.warn(`[AdventureManager] DB access failed for user ${userId}: ${error.message}`);

      }

    }

    if (userData.adventure?.name) {

      return { success: false, error: `You're already registered as ${userData.adventure.name}!` };

    }

    if (this.db) {

      try {

        const existing = await this.db.db("users").findOne({ "data.adventure.name": { $regex: `^${name}$`, $options: "i" } });

        if (existing) {

          return { success: false, error: `Name ${name} is already taken! Choose another.` };

        }

      } catch (error) {

        console.warn(`[AdventureManager] Failed to check name uniqueness for ${name}: ${error.message}`);

      }

    }

    if (!userData.adventure) userData.adventure = { inventory: {}, cooldowns: {} };

    userData.adventure.name = name;

    this.usersData.set(userId, userData);

    if (this.db) {

      try {

        await this.db.db("users").updateOne(

          { userId },

          { $set: { userId: userId, data: userData } },

          { upsert: true }

        );

      } catch (error) {

        console.warn(`[AdventureManager] DB update failed for user ${userId}: ${error.message}`);

      }

    }

    return { success: true };

  }

  async updateAdventure(userId, zoneKey, lastAdventured) {

    let userData = await this.getAdventurer(userId);

    if (!userData.adventure.cooldowns) userData.adventure.cooldowns = {};

    userData.adventure.cooldowns[zoneKey] = { lastAdventured };

    this.usersData.set(userId, userData);

    if (this.db) {

      try {

        await this.db.db("users").updateOne(

          { userId },

          { $set: { userId: userId, data: userData } },

          { upsert: true }

        );

      } catch (error) {

        console.warn(`[AdventureManager] DB update failed for user ${userId}: ${error.message}`);

      }

    }

  }

  async addReward(userId, coins, itemKey, quantity) {

    let userData = await this.getAdventurer(userId);

    userData.balance = (userData.balance || 0) + coins;

    if (itemKey) {

      if (!userData.adventure.inventory[itemKey]) userData.adventure.inventory[itemKey] = { quantity: 0 };

      userData.adventure.inventory[itemKey].quantity += quantity;

    }

    this.usersData.set(userId, userData);

    if (this.db) {

      try {

        await this.db.db("users").updateOne(

          { userId },

          { $set: { userId: userId, data: userData } },

          { upsert: true }

        );

      } catch (error) {

        console.warn(`[AdventureManager] DB update failed for user ${userId}: ${error.message}`);

      }

    }

  }

}

const zones = [

  { key: "shadow_valley", name: "Shadow Valley", description: "A misty valley with hidden relics.", cooldown: 3600000 },

  { key: "flame_peaks", name: "Flame Peaks", description: "Volcanic peaks with rare ores.", cooldown: 7200000 },

  { key: "mist_isles", name: "Mist Isles", description: "Foggy islands with ancient ruins.", cooldown: 14400000 },

  { key: "frost_caverns", name: "Frost Caverns", description: "Icy caves with frozen treasures.", cooldown: 5400000 },

  { key: "sand_dunes", name: "Sand Dunes", description: "Endless dunes hiding a lost caravan.", cooldown: 9000000 },

  { key: "sky_temples", name: "Sky Temples", description: "Floating temples with mystical artifacts.", cooldown: 10800000 },

  { key: "dark_forest", name: "Dark Forest", description: "A haunted forest with cursed relics.", cooldown: 7200000 },

  { key: "crystal_lake", name: "Crystal Lake", description: "A shimmering lake with magical crystals.", cooldown: 3600000 },

  { key: "thunder_cliffs", name: "Thunder Cliffs", description: "Stormy cliffs with electrified gems.", cooldown: 12600000 },

  { key: "abyss_ruins", name: "Abyss Ruins", description: "Sunken ruins with forgotten secrets.", cooldown: 16200000 },
    
   { key: "ownirv2_company", name: "ownirsv2 Company", description: "Explore the world of aggni members of ownirsV2 Company ", cooldown: 16200000 }

];

const outcomes = [

  { type: "loot", description: "Discovered a hidden cache!", rewards: { coins: 150, itemKey: "crystal_shard", quantity: 2 } },

  { type: "enemy", description: "Fought off a bandit ambush!", rewards: { coins: 100 } },

  { type: "obstacle", description: "Navigated a treacherous path!", rewards: { coins: 50 } },

  { type: "treasure", description: "Unearthed an ancient chest!", rewards: { coins: 200, itemKey: "golden_amulet", quantity: 1 } },

  { type: "beast", description: "Defeated a wild beast guarding treasure!", rewards: { coins: 120, itemKey: "beast_fang", quantity: 3 } },

  { type: "trap", description: "Escaped a deadly trap with minor loot!", rewards: { coins: 80, itemKey: "rusty_key", quantity: 1 } },

  { type: "mystic", description: "Encountered a mystic spirit and gained wisdom!", rewards: { coins: 100, itemKey: "spirit_essence", quantity: 2 } },

  { type: "riddle", description: "Solved a riddle to unlock a secret stash!", rewards: { coins: 180, itemKey: "silver_coin", quantity: 5 } }

];

module.exports = {

  name: "adventure",

  description: "Register or explore zones using #adventure register <name> or #adventure <zone_key>",

  usage: "#adventure register Shadow_Warrior",

  async run({ api, event, args, db, usersData }) {

    const { threadID, messageID, senderID } = event;

    if (!usersData) {

      console.error("[Adventure] usersData is undefined");

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content: `Internal error: Data cache not initialized. Contact bot admin.`

        }),

        threadID,

        messageID

      );

    }

    const adventureManager = new AdventureManager(db, usersData);

    if (args[0]?.toLowerCase() === "register") {

      if (!args[1]) {

        return api.sendMessage(

          format({

            title: "Adventure",

            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

            titleFont: "double_struck",

            emojis: "🌍",

            content: `Please provide a name!\nUse #adventure register <name>\nExample: #adventure register Shadow_Warrior`

          }),

          threadID,

          messageID

        );

      }

      const name = args.slice(1).join("_");

      const result = await adventureManager.registerAdventurer(senderID, name);

      if (!result.success) {

        return api.sendMessage(

          format({

            title: "Adventure",

            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

            titleFont: "double_struck",

            emojis: "🌍",

            content: `${result.error}`

          }),

          threadID,

          messageID

        );

      }

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content: `Registered as ${name}!\nStart exploring with #adventure <zone_key>\nCheck inventory with #inventory`

        }),

        threadID,

        messageID

      );

    }

    const adventurer = await adventureManager.getAdventurer(senderID);

    if (!adventurer.adventure.name) {

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content: `You're not registered!\nUse #adventure register <name>\nExample: #adventure register Shadow_Warrior`

        }),

        threadID,

        messageID

      );

    }

    if (args[0]?.toLowerCase() === "list") {

      let content = `**Adventurer List:**\n━━━━━━━━━━━━━━━\n`;

      for (let [userId, userData] of usersData) {

        if (userData.adventure?.name) {

          const inventory = userData.adventure.inventory || {};

          const items = Object.entries(inventory)

            .map(([key, { quantity }]) => `${key.replace("_", " ")}: ${quantity}`)

            .join(", ") || "None";

          content += `🌍 『 ${userData.adventure.name} 』\n`;

          content += `**User ID:** ${userId}\n`;

          content += `**Inventory:** ${items}\n`;

          content += `**Coins:** ${userData.balance || 0}\n\n`;

        }

      }

      if (!content.includes("『")) {

        content += "No adventurers registered yet!";

      }

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content

        }),

        threadID,

        messageID

      );

    }

    if (!args[0]) {

      let content = `***Adventure Zones:***\n━━━━━━━━━━━━━━━\n`;

      zones.forEach(z => {

        const lastAdventured = adventurer.adventure.cooldowns && adventurer.adventure.cooldowns[z.key]?.lastAdventured || 0;

        const timeLeft = lastAdventured + z.cooldown - Date.now();

        content += `🌍 『 ${z.name} 』\n`;

        content += `**Key:** ${z.key}\n`;

        content += `**Description:** ${z.description}\n`;

        content += `**Cooldown:** ${z.cooldown / 3600000} hours\n`;

        content += `**Status:** ${timeLeft > 0 ? `On cooldown (${Math.ceil(timeLeft / 60000)} min)` : "Ready"}\n`;

        content += `━━━━━━━━━━━━━━━\n`;

      });

      content += `> Use #adventure <zone_key> to explore\n*Example: #adventure shadow_valley\n*> Use #adventure list to see adventurers`;

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content

        }),

        threadID,

        messageID

      );

    }

    const zoneKey = args[0].toLowerCase();

    const zone = zones.find(z => z.key === zoneKey);

    if (!zone) {

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content: `Invalid zone key!\nUse #adventure to see zones\nExample: #adventure shadow_valley`

        }),

        threadID,

        messageID

      );

    }

    const lastAdventured = adventurer.adventure.cooldowns && adventurer.adventure.cooldowns[zoneKey]?.lastAdventured || 0;

    if (Date.now() < lastAdventured + zone.cooldown) {

      const timeLeft = (lastAdventured + zone.cooldown - Date.now()) / 60000;

      return api.sendMessage(

        format({

          title: "Adventure",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "🌍",

          content: `**${adventurer.adventure.name} is on cooldown!\nTry again in ${Math.ceil(timeLeft)} minutes.**`

        }),

        threadID,

        messageID

      );

    }

    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    await adventureManager.updateAdventure(senderID, zoneKey, Date.now());

    await adventureManager.addReward(senderID, outcome.rewards.coins || 0, outcome.rewards.itemKey, outcome.rewards.quantity || 0);

    let content = `Adventured in ${zone.name}!*\nEvent: ${outcome.description}\n`;

    if (outcome.rewards.coins) content += `Earned ${outcome.rewards.coins} coins\n`;

    if (outcome.rewards.itemKey) content += `Found ${outcome.rewards.quantity} ${outcome.rewards.itemKey.replace("_", " ")}\n`;

    content += `> Check inventory with #inventory\n*> Trade items with #trade`;

    return api.sendMessage(

      format({

        title: "Adventure",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        emojis: "🌍",

        content

      }),

      threadID,

      messageID

    );

  }

};