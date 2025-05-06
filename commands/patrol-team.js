const fs = require("fs-extra");

const path = require("path");

const { format, UNIRedux } = require("cassidy-styler");

// Define boss stats for reference (same as in dungeon-fightv2.js)

const bossStats = {

  Igris: { health: 600, attack: 100 },

  Beru: { health: 700, attack: 110 },

  Tusk: { health: 500, attack: 90 },

  Iron: { health: 650, attack: 95 },

  Tank: { health: 800, attack: 120 },

  Kamish: { health: 900, attack: 130 },

};

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

  saveHunters() {

    fs.writeFileSync(this.huntersFile, JSON.stringify(this.hunters, null, 2));

  }

  getHunter(userId) {

    return this.hunters[userId] || null;

  }

  updateHunter(userId, updates) {

    if (this.hunters[userId]) {

      Object.assign(this.hunters[userId], updates);

      this.saveHunters();

    }

  }

}

module.exports = {

  name: "patrol-team",

  description: "Send your arisen shadow on a patrol mission using #patrol-team <nickname>",

  usage: "#patrol-team <nickname>",

  async run({ api, event, args }) {

    const { threadID, messageID, senderID } = event;

    const hunterManager = new HunterManager();

    const hunter = hunterManager.getHunter(senderID);

    // Check if user is registered

    if (!hunter) {

      const errorMessage = format({

        title: "Patrol Mission ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    // Check if arguments are provided

    if (args.length < 1) {

      const errorMessage = format({

        title: "Patrol Mission ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `Invalid format! Please use: #patrol-team <nickname>\nExample: #patrol-team tuskShadow`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const nickname = args.join(" "); // Join all args as the nickname

    // Check if the user has the arisen soldier

    hunter.arisenSoldiers = hunter.arisenSoldiers || [];

    const soldier = hunter.arisenSoldiers.find(s => s.nickname === nickname);

    if (!soldier) {

      const errorMessage = format({

        title: "Patrol Mission ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You don't have an arisen shadow named ${nickname}!\nUse #arise-list to see your arisen shadows.`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    // Check if a patrol is already active

    hunter.patrol = hunter.patrol || {};

    if (hunter.patrol.active) {

      const now = Date.now();

      const patrolEndTime = hunter.patrol.startTime + 5 * 60 * 1000; // 5 minutes

      if (now < patrolEndTime) {

        const timeLeft = Math.ceil((patrolEndTime - now) / 1000);

        const errorMessage = format({

          title: "Patrol Mission ⚔️",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          contentFont: "fancy_italic",

          content: `A patrol is already active! Wait ${timeLeft} seconds to collect the rewards using #patrol-collect.`,

        });

        return api.sendMessage(errorMessage, threadID, messageID);

      }

    }

    // Generate patrol team

    const bossName = soldier.name;

    const bossStat = bossStats[bossName];

    const numSoldiers = Math.floor(Math.random() * 6) + 5; // 5-10 soldiers

    // Calculate success chance (based on boss stats and number of soldiers)

    const baseSuccessChance = 50; // Base 50% success chance

    const statContribution = (bossStat.health + bossStat.attack) / 20; // Higher stats increase success chance

    const soldierContribution = numSoldiers * 2; // Each soldier adds 2% to success chance

    const successChance = Math.min(90, baseSuccessChance + statContribution + soldierContribution); // Cap at 90%

    const patrolSucceeds = Math.random() * 100 < successChance;

    // Calculate rewards

    const baseReward = 100 + (bossStat.health + bossStat.attack) / 5; // Reward scales with boss stats

    const reward = patrolSucceeds ? Math.floor(baseReward * (1 + numSoldiers / 10)) : 50; // Success: full reward, Failure: 50 coins

    // Store patrol data

    hunter.patrol = {

      active: true,

      startTime: Date.now(),

      team: { bossName, nickname, numSoldiers },

      success: patrolSucceeds,

      reward,

    };

    hunterManager.updateHunter(senderID, { patrol: hunter.patrol });

    const message = format({

      title: "Patrol Mission ⚔️",

      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

      titleFont: "double_struck",

      contentFont: "fancy_italic",

      content: `Your patrol team led by ${nickname} (${bossName}) with ${numSoldiers} soldiers has been sent out!\nPatrol Duration: 5 minutes\nUse #patrol-collect after 5 minutes to see the results and collect your rewards.`,

    });

    return api.sendMessage(message, threadID, messageID);

  },

};