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

  updateRank(userId) {

    const hunter = this.hunters[userId];

    if (!hunter) return;

    const exp = hunter.exp;

    if (exp >= 10000) hunter.rank = "S";

    else if (exp >= 5000) hunter.rank = "A";

    else if (exp >= 2000) hunter.rank = "B";

    else if (exp >= 500) hunter.rank = "C";

    else if (exp >= 100) hunter.rank = "D";

    this.saveHunters();

  }

}

const enemies = [

  { name: "Skeleton Soldier", emoji: "💀", health: 30, attack: 10 },

  { name: "Goblin Scout", emoji: "👹", health: 25, attack: 8 },

  { name: "Ice Elf", emoji: "🧝", health: 40, attack: 15 },

  { name: "Shadow Hound", emoji: "🐺", health: 45, attack: 18 },

  { name: "Fire Drake", emoji: "🐉", health: 50, attack: 20 },

  { name: "Poison Viper", emoji: "🐍", health: 30, attack: 10 },

  { name: "Stone Golem", emoji: "🗿", health: 60, attack: 15 },

  { name: "Dark Mage", emoji: "🧙", health: 35, attack: 14 },

  { name: "Blood Orc", emoji: "🧝", health: 50, attack: 16 },

  { name: "Frost Giant", emoji: "🧊", health: 70, attack: 20 },

  { name: "Iron Knight", emoji: "⚔️", health: 40, attack: 12 },

  { name: "Thunder Hawk", emoji: "🦅", health: 35, attack: 15 },

  { name: "Abyss Wraith", emoji: "👻", health: 30, attack: 13 },

  { name: "Lava Serpent", emoji: "🐍", health: 50, attack: 18 },

  { name: "Crystal Spider", emoji: "🕷️", health: 25, attack: 8 },

  { name: "Shadow Assassin", emoji: "🗡️", health: 45, attack: 16 },

  { name: "Bone Dragon", emoji: "🐉", health: 60, attack: 20 },

  { name: "Cursed Knight", emoji: "⚔️", health: 55, attack: 18 },

  { name: "Magma Titan", emoji: "🌋", health: 80, attack: 22 },

  { name: "Ice Wraith", emoji: "👻", health: 35, attack: 12 },

  { name: "Storm Elemental", emoji: "⚡", health: 40, attack: 15 },

  { name: "Dark Elf Archer", emoji: "🏹", health: 35, attack: 14 },

  { name: "Venomous Scorpion", emoji: "🦂", health: 30, attack: 10 },

  { name: "Obsidian Golem", emoji: "🗿", health: 70, attack: 20 },

  { name: "Blood Raven", emoji: "🦅", health: 25, attack: 9 },

  { name: "Shadow Knight", emoji: "⚔️", health: 50, attack: 16 },

  { name: "Frost Wolf", emoji: "🐺", health: 40, attack: 14 },

  { name: "Abyssal Serpent", emoji: "🐍", health: 55, attack: 18 },

  { name: "Thunder Golem", emoji: "🗿", health: 65, attack: 20 },

  { name: "Dark Sorcerer", emoji: "🧙", health: 45, attack: 15 },

  { name: "Fire Elemental", emoji: "🔥", health: 40, attack: 14 },

  { name: "Ice Dragon", emoji: "🐉", health: 70, attack: 22 },

];

const bosses = [

  { name: "Igris", emoji: "⚔️", health: 600, attack: 100 },

  { name: "Beru", emoji: "🐜", health: 700, attack: 110 },

  { name: "Tusk", emoji: "🧙", health: 500, attack: 90 },

  { name: "Iron", emoji: "🛡️", health: 650, attack: 95 },

  { name: "Tank", emoji: "🐻", health: 800, attack: 120 },

  { name: "Kamish", emoji: "🐉", health: 900, attack: 130 },

];

const getRandomEnemiesAndBoss = () => {

  const enemyCount = Math.floor(Math.random() * 6) + 10;

  const selectedEnemies = [];

  for (let i = 0; i < enemyCount; i++) {

    const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];

    selectedEnemies.push({ ...randomEnemy });

  }

  const boss = bosses[Math.floor(Math.random() * bosses.length)];

  return { enemies: selectedEnemies, boss: { ...boss } };

};

const calculatePlayerStats = (hunter) => {

  let playerHealth = 200;

  let playerAttack = 20 + Math.floor(hunter.exp / 50);

  let playerMana = hunter.mana;

  let defenseBoost = 0;

  if (hunter.activeWeapon) {

    const activeWeaponDetails = hunter.inventory[hunter.activeWeapon];

    if (activeWeaponDetails) {

      playerAttack += activeWeaponDetails.damage;

    }

  } else {

    for (const [itemKey, details] of Object.entries(hunter.inventory)) {

      if (itemKey.includes("_damage-")) {

        playerAttack += details.damage * details.quantity;

      }

    }

  }

  for (const [itemKey, details] of Object.entries(hunter.inventory)) {

    if (itemKey === "health_potion") {

      playerHealth += 100 * details.quantity;

    } else if (itemKey === "mana_potion") {

      playerMana += 30 * details.quantity;

    } else if (itemKey === "energy_potion") {

      playerMana += 40 * details.quantity;

    } else if (itemKey === "defense_potion") {

      defenseBoost += 15 * details.quantity;

    }

  }

  return { health: playerHealth, attack: playerAttack, mana: playerMana, defenseBoost };

};

module.exports = {

  name: "dungeon-fightv2",

  description: "Fight enemies and bosses in a dungeon using #dungeon-fightv2",

  usage: "#dungeon-fightv2",

  async run({ api, event }) {

    const { threadID, messageID, senderID } = event;

    const hunterManager = new HunterManager();

    const hunter = hunterManager.getHunter(senderID);

    if (!hunter) {

      const errorMessage = format({

        title: "Dungeon Fight ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    const now = Date.now();

    const sixMinutes = 6 * 60 * 1000;

    if (now - hunter.attempts.lastReset >= sixMinutes) {

      hunter.attempts.count = 8;

      hunter.attempts.lastReset = now;

    }

    if (hunter.attempts.count <= 0) {

      const timeLeft = Math.ceil((sixMinutes - (now - hunter.attempts.lastReset)) / 1000);

      const errorMessage = format({

        title: "Dungeon Fight ⚔️",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        contentFont: "fancy_italic",

        content: `You have no attempts left!\nWait ${timeLeft} seconds for your attempts to reset (8 attempts every 6 minutes).`,

      });

      return api.sendMessage(errorMessage, threadID, messageID);

    }

    hunter.attempts.count -= 1;

    hunterManager.saveHunters();

    const balanceFile = path.join(__dirname, "../database/balance.json");

    let balances = {};

    try {

      balances = JSON.parse(fs.readFileSync(balanceFile, "utf8"));

    } catch (error) {

      balances = {};

    }

    if (!balances[senderID]) {

      balances[senderID] = { balance: 0, bank: 0 };

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

    }

    const playerStats = calculatePlayerStats(hunter);

    let playerHealth = playerStats.health;

    let playerAttack = playerStats.attack;

    let playerMana = playerStats.mana;

    let defenseBoost = playerStats.defenseBoost;

    const maxHealth = playerHealth;

    const { enemies: selectedEnemies, boss } = getRandomEnemiesAndBoss();

    let enemiesDefeated = 0;

    let battleLog = `You encounter ${selectedEnemies.length} enemies and 1 boss named ${boss.name}!\n`;

    battleLog += `Your Stats: ${playerHealth} Health | ${playerAttack} Attack\n`;

    for (let enemy of selectedEnemies) {

      let enemyHealth = enemy.health;

      let enemyAttack = enemy.attack;

      battleLog += `Enemy Stats: ${enemyHealth} Health | ${enemyAttack} Attack\n\n`;

      while (playerHealth > 0 && enemyHealth > 0) {

        enemyHealth -= playerAttack;

        battleLog += `You attack the ${enemy.name} for ${playerAttack} damage!\n`;

        battleLog += `Enemy Health: ${enemyHealth > 0 ? enemyHealth : 0}\n`;

        if (enemyHealth <= 0) {

          enemiesDefeated++;

          hunter.exp += 10;

          const healthRecovered = Math.floor(maxHealth * 0.1);

          playerHealth = Math.min(playerHealth + healthRecovered, maxHealth);

          battleLog += `You recover ${healthRecovered} health after defeating the enemy!\n`;

          battleLog += `Player Health: ${playerHealth}\n\n`;

          break;

        }

        const damageTaken = Math.max(0, enemyAttack - defenseBoost);

        playerHealth -= damageTaken;

        battleLog += `${enemy.emoji} ${enemy.name} attacks you for ${damageTaken} damage!\n`;

        battleLog += `Player Health: ${playerHealth > 0 ? playerHealth : 0}\n\n`;

      }

      if (playerHealth <= 0) break;

    }

    let outcomeMessage = "";

    let bossDefeated = false;

    if (playerHealth > 0) {

      let bossHealth = boss.health;

      let bossAttack = boss.attack;

      battleLog += `Boss Stats: ${bossHealth} Health | ${bossAttack} Attack\n\n`;

      while (playerHealth > 0 && bossHealth > 0) {

        bossHealth -= playerAttack;

        battleLog += `You attack ${boss.name} for ${playerAttack} damage!\n`;

        battleLog += `Boss Health: ${bossHealth > 0 ? bossHealth : 0}\n`;

        if (bossHealth <= 0) {

          bossDefeated = true;

          hunter.exp += 500;

          break;

        }

        const damageTaken = Math.max(0, bossAttack - defenseBoost);

        playerHealth -= damageTaken;

        battleLog += `${boss.emoji} ${boss.name} attacks you for ${damageTaken} damage!\n`;

        battleLog += `Player Health: ${playerHealth > 0 ? playerHealth : 0}\n\n`;

      }

    }

    if (playerHealth <= 0) {

      outcomeMessage = `You were defeated in the dungeon!\n`;

      outcomeMessage += `Enemies Defeated: ${enemiesDefeated}\n`;

      outcomeMessage += `Attempts Left: ${hunter.attempts.count}\n`;

      outcomeMessage += `Status Updated:\nExp: ${hunter.exp}\nMana: ${playerMana}\n`;

    } else {

      const coinReward = enemiesDefeated * 10 + (bossDefeated ? 500 : 0);

      balances[senderID].balance += coinReward;

      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));

      outcomeMessage = `You cleared the dungeon!\n`;

      outcomeMessage += `Enemies Defeated: ${enemiesDefeated}\n`;

      if (bossDefeated) {

        outcomeMessage += `You defeated the boss ${boss.name}! Use #arise ${boss.name.toLowerCase()} <nickname> to arise your shadow.\nExample: #arise ${boss.name.toLowerCase()} shadow${boss.name}\n`;

        hunter.defeatedBosses = hunter.defeatedBosses || [];

        hunter.defeatedBosses.push(boss.name);

      }

      outcomeMessage += `Attempts Left: ${hunter.attempts.count}\n`;

      outcomeMessage += `Status Updated:\nExp: ${hunter.exp}\nMana: ${playerMana}\n`;

      outcomeMessage += `Reward: ${coinReward} coins\n`;

      outcomeMessage += `New Wallet Balance: ${balances[senderID].balance} coins`;

    }

    hunter.mana = playerMana;

    hunterManager.updateHunter(senderID, { exp: hunter.exp, mana: hunter.mana, defeatedBosses: hunter.defeatedBosses });

    hunterManager.updateRank(senderID);

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