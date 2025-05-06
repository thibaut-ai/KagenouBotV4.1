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
  addItem(userId, itemKey, damage, quantity) {
    const hunter = this.hunters[userId];
    if (!hunter) return;
    if (!hunter.inventory[itemKey]) hunter.inventory[itemKey] = { quantity: 0, damage: 0 };
    hunter.inventory[itemKey].quantity += quantity;
    hunter.inventory[itemKey].damage = damage;
    this.saveHunters();
  }
}

const weapons = [
  { key: "ice_dagger", name: "Ice Dagger", emoji: "🗡️", damageOptions: { "damage-10": 10, "damage-30": 30, "damage-50": 50 }, prices: { "damage-10": 100, "damage-30": 300, "damage-50": 1000 } },
  { key: "flame_sword", name: "Flame Sword", emoji: "⚔️", damageOptions: { "damage-15": 15, "damage-40": 40, "damage-60": 60 }, prices: { "damage-15": 150, "damage-40": 400, "damage-60": 1200 } },
  { key: "thunder_axe", name: "Thunder Axe", emoji: "🪓", damageOptions: { "damage-20": 20, "damage-50": 50, "damage-80": 80 }, prices: { "damage-20": 200, "damage-50": 500, "damage-80": 1500 } },
  { key: "shadow_blade", name: "Shadow Blade", emoji: "⚔️", damageOptions: { "damage-25": 25, "damage-60": 60, "damage-100": 100 }, prices: { "damage-25": 250, "damage-60": 600, "damage-100": 2000 } },
  { key: "dragon_spear", name: "Dragon Spear", emoji: "🏹", damageOptions: { "damage-30": 30, "damage-70": 70, "damage-120": 120 }, prices: { "damage-30": 300, "damage-70": 700, "damage-120": 2500 } },
  { key: "frost_hammer", name: "Frost Hammer", emoji: "🔨", damageOptions: { "damage-35": 35, "damage-80": 80, "damage-140": 140 }, prices: { "damage-35": 350, "damage-80": 800, "damage-140": 3000 } },
  { key: "abyssal_scythe", name: "Abyssal Scythe", emoji: "🌙", damageOptions: { "damage-40": 40, "damage-90": 90, "damage-160": 160 }, prices: { "damage-40": 400, "damage-90": 900, "damage-160": 3500 } },
  { key: "lightning_bow", name: "Lightning Bow", emoji: "🏹", damageOptions: { "damage-45": 45, "damage-100": 100, "damage-180": 180 }, prices: { "damage-45": 450, "damage-100": 1000, "damage-180": 4000 } },
  { key: "blood_katana", name: "Blood Katana", emoji: "⚔️", damageOptions: { "damage-50": 50, "damage-110": 110, "damage-200": 200 }, prices: { "damage-50": 500, "damage-110": 1100, "damage-200": 4500 } },
  { key: "void_reaper", name: "Void Reaper", emoji: "🌑", damageOptions: { "damage-60": 60, "damage-120": 120, "damage-220": 220 }, prices: { "damage-60": 600, "damage-120": 1200, "damage-220": 5000 } },
  { key: "storm_claw", name: "Storm Claw", emoji: "🗡️", damageOptions: { "damage-70": 70, "damage-130": 130, "damage-240": 240 }, prices: { "damage-70": 700, "damage-130": 1300, "damage-240": 5500 } },
  { key: "eternal_lance", name: "Eternal Lance", emoji: "🏹", damageOptions: { "damage-80": 80, "damage-140": 140, "damage-260": 260 }, prices: { "damage-80": 800, "damage-140": 1400, "damage-260": 6000 } },
  { key: "inferno_glaive", name: "Inferno Glaive", emoji: "🔥", damageOptions: { "damage-90": 90, "damage-150": 150, "damage-280": 280 }, prices: { "damage-90": 900, "damage-150": 1500, "damage-280": 6500 } },
  { key: "celestial_sword", name: "Celestial Sword", emoji: "⚔️", damageOptions: { "damage-100": 100, "damage-160": 160, "damage-300": 300 }, prices: { "damage-100": 1000, "damage-160": 1600, "damage-300": 7000 } },
];

const potions = [
  { key: "health_potion", name: "Health Potion", emoji: "🧪", price: 50, description: "Restores 50 health in dungeon fights." },
  { key: "mana_potion", name: "Mana Potion", emoji: "💎", price: 80, description: "Increases mana by 20 in dungeon fights." },
  { key: "strength_potion", name: "Strength Potion", emoji: "💪", price: 100, description: "Boosts attack by 10 for one fight." },
  { key: "speed_potion", name: "Speed Potion", emoji: "⚡", price: 90, description: "Increases dodge chance by 5%." },
  { key: "defense_potion", name: "Defense Potion", emoji: "🛡️", price: 120, description: "Reduces damage taken by 10." },
  { key: "regen_potion", name: "Regen Potion", emoji: "🌿", price: 150, description: "Restores 10 health per turn." },
  { key: "focus_potion", name: "Focus Potion", emoji: "🎯", price: 130, description: "Increases crit chance by 5%." },
  { key: "vitality_potion", name: "Vitality Potion", emoji: "❤️", price: 200, description: "Increases max health by 20." },
  { key: "energy_potion", name: "Energy Potion", emoji: "⚡", price: 180, description: "Restores 30 mana." },
  { key: "luck_potion", name: "Luck Potion", emoji: "🍀", price: 250, description: "Increases item drop chance by 10%." },
];

const getWeaponByKey = (key) => weapons.find(w => w.key === key) || null;
const getPotionByKey = (key) => potions.find(p => p.key === key) || null;

const sortedWeapons = weapons.map(w => ({
  ...w,
  cheapestPrice: w.prices["damage-10"],
  highestPrice: Object.values(w.prices).slice(-1)[0],
}));
const expensiveWeapons = sortedWeapons.sort((a, b) => b.highestPrice - a.highestPrice).slice(0, 10);
const cheapestWeapons = sortedWeapons.sort((a, b) => a.cheapestPrice - b.cheapestPrice).slice(0, 5);

module.exports = {
  name: "shopv2",
  description: "Buy weapons and potions using #shopv2 <key> <damage_option> <quantity> or #shopv2 <potion_key> <quantity>",
  usage: "#shopv2 ice_dagger damage-50 2",
  async run({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const hunterManager = new HunterManager();
    const hunter = hunterManager.getHunter(senderID);
    if (!hunter) {
      const errorMessage = format({
        title: "Shop 🛒",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `You are not a registered hunter!\nUse #hunter register <name> to register.\nExample: #hunter register Sung_jinwoo`,
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
    if (!balances[senderID]) {
      balances[senderID] = { balance: 0, bank: 0 };
      fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));
    }
    if (!args[0]) {
      let content = `Top 10 Expensive Weapons:\n━━━━━━━━━━━━━━━\n`;
      expensiveWeapons.forEach(w => {
        const maxDamageOption = Object.keys(w.damageOptions).slice(-1)[0];
        content += `${w.emoji} 『 ${w.name} (${maxDamageOption}) 』\nKey: ${w.key}\nDamage: ${w.damageOptions[maxDamageOption]}\nPrice: ${w.highestPrice} coins\n\n`;
      });
      content += `5 Cheapest Weapons:\n━━━━━━━━━━━━━━━\n`;
      cheapestWeapons.forEach(w => {
        content += `${w.emoji} 『 ${w.name} (damage-10) 』\nKey: ${w.key}\nDamage: ${w.damageOptions["damage-10"]}\nPrice: ${w.cheapestPrice} coins\n\n`;
      });
      content += `Potions:\n━━━━━━━━━━━━━━━\n`;
      potions.forEach(p => {
        content += `${p.emoji} 『 ${p.name} 』\nKey: ${p.key}\nDescription: ${p.description}\nPrice: ${p.price} coins\n\n`;
      });
      content += `💰 Your Wallet: ${balances[senderID].balance} coins\n\n> Use #shopv2 <key> <damage_option> <quantity> for weapons\n> Use #shopv2 <potion_key> <quantity> for potions\nExample: #shopv2 ice_dagger damage-50 2`;
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
    const quantity = parseInt(args[args.length - 1]) || 1;
    const damageOption = args[1]?.toLowerCase();
    if (isNaN(quantity) || quantity <= 0) {
      const errorMessage = format({
        title: "Shop 🛒",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `Please provide a valid quantity!\nExample: #shopv2 ${itemKey} ${damageOption || ""} 5`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    let item, price, damage, itemType;
    const weapon = getWeaponByKey(itemKey);
    const potion = getPotionByKey(itemKey);
    if (weapon) {
      itemType = "weapon";
      if (!damageOption || !weapon.damageOptions[damageOption]) {
        const errorMessage = format({
          title: "Shop 🛒",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          contentFont: "fancy_italic",
          content: `Invalid damage option for ${weapon.name}!\nAvailable options: ${Object.keys(weapon.damageOptions).join(", ")}\nUse #shopv2 to see the shop menu.`,
        });
        return api.sendMessage(errorMessage, threadID, messageID);
      }
      item = weapon;
      price = weapon.prices[damageOption];
      damage = weapon.damageOptions[damageOption];
    } else if (potion) {
      itemType = "potion";
      if (args.length > 2) {
        const errorMessage = format({
          title: "Shop 🛒",
          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
          titleFont: "double_struck",
          contentFont: "fancy_italic",
          content: `Potions do not require a damage option!\nUse #shopv2 <potion_key> <quantity>\nExample: #shopv2 health_potion 5`,
        });
        return api.sendMessage(errorMessage, threadID, messageID);
      }
      item = potion;
      price = potion.price;
      damage = 0;
    } else {
      const errorMessage = format({
        title: "Shop 🛒",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `Item not found!\nUse #shopv2 to see the shop menu.`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    const totalCost = price * quantity;
    if (balances[senderID].balance < totalCost) {
      const errorMessage = format({
        title: "Shop 🛒",
        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
        titleFont: "double_struck",
        contentFont: "fancy_italic",
        content: `You don't have enough coins!\nTotal Cost: ${totalCost} coins\nYour Wallet: ${balances[senderID].balance} coins`,
      });
      return api.sendMessage(errorMessage, threadID, messageID);
    }
    balances[senderID].balance -= totalCost;
    fs.writeFileSync(balanceFile, JSON.stringify(balances, null, 2));
    const inventoryKey = itemType === "weapon" ? `${item.key}_${damageOption}` : item.key;
    hunterManager.addItem(senderID, inventoryKey, damage, quantity);
    const successMessage = format({
      title: "Shop 🛒",
      titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,
      titleFont: "double_struck",
      contentFont: "fancy_italic",
      content: `Successfully purchased ${quantity} ${item.emoji} ${item.name}${itemType === "weapon" ? ` (${damageOption})` : ""}!\nTotal Cost: ${totalCost} coins\n💰 New Wallet Balance: ${balances[senderID].balance} coins`,
    });
    return api.sendMessage(successMessage, threadID, messageID);
  },
};