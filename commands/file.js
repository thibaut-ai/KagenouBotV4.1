const fs = require("fs-extra");
const path = require("path");
module.exports = {
  name: "file",
  description: "View the raw code of a command file (developers only)",
  role: 3,
  async run({ api, event, args }) {
    const { threadID, messageID } = event;
    const filename = args[0];
    if (!filename) {
      return api.sendMessage("Please specify a file name (e.g., #file ping).", threadID, messageID);
    }
    const commandsDir = path.join(__dirname, "..", "commands");
    const filePath = path.join(commandsDir, `${filename}.js`);
    try {
      if (!fs.existsSync(filePath)) {
        return api.sendMessage(`File '${filename}.js' not found in commands directory.`, threadID, messageID);
      }
      const fileContent = fs.readFileSync(filePath, "utf8");
      return api.sendMessage(`Raw code for '${filename}.js':\n\`\`\`\n${fileContent}\n\`\`\``, threadID, messageID);
    } catch (error) {
      console.error(`[COMMAND ERROR] Failed to read file '${filename}.js':`, error);
      return api.sendMessage(`Error reading file '${filename}.js': ${error.message}`, threadID, messageID);
    }
  },
};