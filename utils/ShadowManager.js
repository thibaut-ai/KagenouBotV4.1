const fs = require("fs-extra");

const path = require("path");

class ShadowManager {

  constructor() {

    this.shadowsFile = path.join(__dirname, "../database/shadows.json");

    this.balanceFile = path.join(__dirname, "../database/balance.json");

    this.shadows = this.loadShadows();

    this.balance = this.loadBalance();

  }

  loadShadows() {

    try {

      return JSON.parse(fs.readFileSync(this.shadowsFile, "utf8")) || {};

    } catch (error) {

      return {};

    }

  }

  loadBalance() {

    try {

      return JSON.parse(fs.readFileSync(this.balanceFile, "utf8")) || {};

    } catch (error) {

      return {};

    }

  }

  saveShadows() {

    fs.writeFileSync(this.shadowsFile, JSON.stringify(this.shadows, null, 2));

  }

  saveBalance() {

    fs.writeFileSync(this.balanceFile, JSON.stringify(this.balance, null, 2));

  }

  registerShadow(userId, shadowName) {

    for (const id in this.shadows) {

      if (this.shadows[id].shadowName.toLowerCase() === shadowName.toLowerCase()) {

        return { success: false, error: "Shadow name already exists! Choose a different name." };

      }

    }

    this.shadows[userId] = {

      shadowName,

      character: null,

      inventory: {},

      balance: this.balance[userId] ? this.balance[userId].balance : 0,

    };

    this.balance[userId] = { balance: 0 };

    this.saveShadows();

    this.saveBalance();

    return { success: true };

  }

  getShadow(userId) {

    return this.shadows[userId] || null;

  }

  chooseCharacter(userId, characterName) {

    const shadow = this.getShadow(userId);

    if (!shadow) return { success: false, error: "You must register as a Shadow first!" };

    if (shadow.character) return { success: false, error: "You already chose a character!" };

    const validCharacters = ["Cid Kagenou", "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta"];

    if (!validCharacters.includes(characterName)) return { success: false, error: "Invalid character!" };

    shadow.character = characterName;

    this.saveShadows();

    return { success: true };

  }

  addToInventory(userId, item, quantity = 1) {

    const shadow = this.getShadow(userId);

    if (!shadow) return false;

    shadow.inventory[item] = (shadow.inventory[item] || 0) + quantity;

    this.saveShadows();

    return true;

  }

  addToBalance(userId, amount) {

    if (!this.balance[userId]) this.balance[userId] = { balance: 0 };

    this.balance[userId].balance += amount;

    this.saveBalance();

  }

  getBalance(userId) {

    return this.balance[userId] ? this.balance[userId].balance : 0;

  }

  deductFromBalance(userId, amount) {

    if (!this.balance[userId] || this.balance[userId].balance < amount) return false;

    this.balance[userId].balance -= amount;

    this.saveBalance();

    return true;

  }

}

module.exports = ShadowManager;