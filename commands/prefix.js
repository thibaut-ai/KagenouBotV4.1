const fs = require("fs");

const path = require("path");

module.exports = {

  name: "prefix",

  author: "Aljur Pogoy",

  nonPrefix: true,

  description: "Shows the bot's current prefixes for all systems.",

  async run({ api, event }) {

    try {

      const mainConfig = require("../config.json");

      const mainPrefix = mainConfig.Prefix?.[0] || "/";

      const tokitoConfigPath = path.join(__dirname, "../SYSTEM/tokito-system/config.json");

      const tokitoConfig = fs.existsSync(tokitoConfigPath) ? require(tokitoConfigPath) : { Prefix: ["?"] };

      const tokitoPrefix = tokitoConfig.Prefix?.[0] || "?";

      const cidConfigPath = path.join(__dirname, "../SYSTEM/cid-kagenou-system/config.json");

      const cidConfig = fs.existsSync(cidConfigPath) ? require(cidConfigPath) : { Prefix: ["!"] };

      const cidPrefix = cidConfig.Prefix?.[0] || "!";   

      const ownirsPath = path.join(__dirname, "../SYSTEM/ownirsv2-system/config.json");

      const ownirsConfig = fs.existsSync(ownirsPath) ? require(ownirsPath) : { prefix: ["."] };

      const ownirsPrefix = ownirsConfig.prefix?.[0] || ".";

      const message =

        "System Prefix Information\n\n" +

        "『 🌐 』Main System Prefix: " + mainPrefix + "\n" +

        "『 🪐 』Tokito System Prefix: " + tokitoPrefix + "\n" +

        "『 🗡️ 』 Cid-Kagenou System Prefix: " + cidPrefix + "\n" +

        "『 ✨ 』 OwnirsV2-System Prefix: " + ownirsPrefix + "\n\n" +

        "To use commands, type the system prefix followed by the command name.";

      // Send message with contact attachment

      api.shareContact(message, api.getCurrentUserID(), event.threadID);

    } catch (error) {

      console.error("Error loading prefixes:", error);

      api.sendMessage("❌ Failed to load prefixes.", event.threadID, event.messageID);

    }

  },

};