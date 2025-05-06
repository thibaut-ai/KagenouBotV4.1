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
  name: "patrol-collect",
  description: "Collect rewards from a completed patrol mission using #patrol-collect",
  usage: "#patrol-collect",
  async run({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const hunterManager = new HunterManager();
    const hunter = hunterManager.getHunter(senderID);
    if (!hunter) {
      const errorMessage = format({
        title: "Patrol Collect ⚔️",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    hunter.patrol = hunter.patrol || {};
    if (!hunter.patrol.active) {
      const errorMessage = format({
        title: "Patrol Collect ⚔️",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `You don't have an active patrol! Use #patrol-team <nickname> to start one.`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    const now = Date.now();
    const patrolEndTime = hunter.patrol.startTime + 5 * 60 * 1000;
    if (now < patrolEndTime) {
      const timeLeft = Math.ceil((patrolEndTime - now) / 1000);
      const errorMessage = format({
        title: "Patrol Collect ⚔️",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `Your patrol is still ongoing! Wait ${timeLeft} seconds to collect the rewards.`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    const balanceFile = path.join(__dirname, "../database/balance.json");
    let balances = {};
    try {
      balances = JSON.parse(fs.readFileSync(balanceFile, "utf8"));
    } catch (error) {
      balances = {};
    }
    if (!balances[senderID]) balances[senderID] = { balance: 0, bank: 0 };
    const reward = hunter.patrol.reward;
    balances[senderID].balance += reward;
    fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));
    const { bossName, nickname, numSoldiers } = hunter.patrol.team;
    const successMessage = hunter.patrol.success
      ? `Your patrol led by ${nickname} (${bossName}) with ${numSoldiers} soldiers was successful!`
      : `Your patrol led by ${nickname} (${bossName}) with ${numSoldiers} soldiers failed to complete the mission.`;
    const rewardMessage = `Reward: ${reward} coins\nNew Wallet Balance: ${balances[senderID].balance} coins`;
    hunter.patrol = { active: false };
    hunterManager.updateHunter(senderID, { patrol: hunter.patrol });
    const message = format({
      title: "Patrol Collect ⚔️",
      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
      titleFont: "double_struck",
      contentFont: "fancy_italic",
      content: `${successMessage}\n${rewardMessage}`,
    });
    return api.sendMessage(message, threadID, messageID);
  },
};