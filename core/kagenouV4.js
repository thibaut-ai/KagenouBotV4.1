const fs = require("fs-extra");
const path = require("path");

const commands = new Map();
const eventCommands = [];
const globalKagenouV4 = { onReaction: new Map(), replies: new Map() };

const commandsDir = path.join(__dirname, "commands");

const loadCommands = () => {
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js") && !file.endsWith(".eg.js"));
  for (const file of commandFiles) {
    try {
      const commandPath = path.join(commandsDir, file);
      delete require.cache[require.resolve(commandPath)];
      const command = require(commandPath);
      if (command.config && command.config.name && command.run) {
        commands.set(command.config.name.toLowerCase(), command);
        if (command.config.aliases) {
          command.config.aliases.forEach(alias => commands.set(alias.toLowerCase(), command));
        }
      }
      if (command.handleEvent) eventCommands.push(command);
    } catch (error) {
      console.error(`Error loading command ${file}:`, error);
    }
  }
  console.log(`Loaded ${commands.size} commands, ${eventCommands.length} event commands`);
};

const handleCommand = async (api, event, args) => {
  const { threadID, senderID, body } = event;
  if (!body) return;
  const commandName = body.toLowerCase().split(" ")[0].replace(/^-/, "");
  const command = commands.get(commandName);
  if (!command) return;
  if (command.config.hasPermission > 0) {
    const userRole = getUserRole(senderID);
    if (userRole < command.config.hasPermission) {
      return api.sendMessage("No permission!", threadID);
    }
  }
  try {
    await command.run({ api, event, args: body.split(" ").slice(1) });
  } catch (error) {
    console.error(`Error in ${commandName}:`, error);
    api.sendMessage(`Error: ${error.message}`, threadID);
  }
};

const handleEvent = async (api, event) => {
  for (const command of eventCommands) {
    try {
      if (command.handleEvent) await command.handleEvent({ api, event });
    } catch (error) {
      console.error(`Event error in ${command.config?.name}:`, error);
    }
  }
};

const handleReply = async (api, event) => {
  const replyData = globalKagenouV4.replies.get(event.messageReply?.messageID);
  if (!replyData) return;
  const command = commands.get(replyData.commandName);
  if (command && command.handleReply) {
    try {
      await command.handleReply({ api, event, ...replyData });
      globalKagenouV4.replies.delete(event.messageReply.messageID);
    } catch (error) {
      console.error(`Reply error in ${replyData.commandName}:`, error);
      api.sendMessage(`Reply error: ${error.message}`, event.threadID);
    }
  }
};

module.exports = {
  loadCommands,
  handleCommand,
  handleEvent,
  handleReply,
  commands,
  eventCommands,
  globalKagenouV4,
};

function getUserRole(uid) {
  uid = String(uid);
  if (global.config.developers.includes(uid)) return 3;
  if (global.config.moderators.includes(uid)) return 2;
  if (global.config.admins.includes(uid)) return 1;
  return 0;
}
