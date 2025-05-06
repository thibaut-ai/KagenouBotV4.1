const { MongoClient } = require("mongodb");
const fs = require("fs-extra");
const path = require("path");
const login = require("chatbox-fca-remake");
const tokitoSystem = require("./SYSTEM/tokito-system#1/index.js");
const cidKagenouSystem = require("./SYSTEM/cid-kagenou-system/index.js");
const ownirsv2System = require("./SYSTEM/ownirsv2-system/index.js");
const apiHandler = require("./utils/apiHandler");
const commands = new Map();
const nonPrefixCommands = new Map();
const eventCommands = [];
const usersData = new Map();
const globalData = new Map();
const commandsDir = path.join(__dirname, "commands");
const bannedUsersFile = path.join(__dirname, "database", "bannedUsers.json");
const configFile = path.join(__dirname, "config.json");
let bannedUsers = {};
let config = { admins: [], prefix: ["#"], mongoUri: null };
process.on("unhandledRejection", console.error.bind(console));
global.client = { reactionListener: {}, globalData: new Map() };
global.Kagenou = { replies: {} };

const loadBannedUsers = () => {
  try {
    bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFile, "utf8"));
  } catch {
    bannedUsers = {};
  }
};

async function handleReply(api, event) {
  const replyData = global.Kagenou.replies[event.messageReply?.messageID];
  if (!replyData) return;
  if (replyData.author && event.senderID !== replyData.author) {
    return api.sendMessage("Only the original sender can reply to this message.", event.threadID, event.messageID);
  }
  try {
    await replyData.callback({ api, event, data: replyData });
  } catch (err) {
    api.sendMessage("An error occurred while processing your reply.", event.threadID, event.messageID);
  }
}

const loadCommands = () => {
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"));
  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsDir, file));
      if (command.config && command.config.name && command.run) {
        commands.set(command.config.name.toLowerCase(), command);
        if (command.config.nonPrefix) nonPrefixCommands.set(command.config.name.toLowerCase(), command);
      } else if (command.name) {
        commands.set(command.name.toLowerCase(), command);
        if (command.nonPrefix) nonPrefixCommands.set(command.name.toLowerCase(), command);
      }
      if (command.handleEvent) eventCommands.push(command);
    } catch (error) {
      console.error(`Error loading command '${file}':`, error);
    }
  }
};

loadCommands();
console.log("ÃƒÂ¢Ã…âœÃ¢â‚¬Å“ Commands loaded:", [...commands.keys()]);
console.log("ÃƒÂ¢Ã…âœÃ¢â‚¬Å“ Non-Prefix Commands:", [...nonPrefixCommands.keys()]);
console.log(" Event Commands:", eventCommands.map(cmd => cmd.name));

let appState = {};
try {
  appState = JSON.parse(fs.readFileSync("./appstate.dev.json", "utf8"));
} catch (error) {
  console.error("Error loading appstate.json:", error);
}

try {
  config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  config = { admins: config.admins || [], Prefix: config.Prefix || ["/"], mongoUri: config.mongoUri || null, ...config };
} catch (error) {
  console.error("Error loading config.json:", error);
  config = { admins: [], Prefix: ["/"], mongoUri: null };
}

let db = null;
console.log("Config loaded:", config);
const uri = config.mongoUri || null;

if (uri) {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  const cidkagenou = {
    db: function (collectionName) {
      const dbInstance = client.db("chatbot_db");
      const collection = dbInstance.collection(collectionName);
      return {
        findOne: async function (query) {
          try {
            return await collection.findOne(query);
          } catch (err) {
            throw new Error(`Error in findOne: ${err.message}`);
          }
        },
        updateOne: async function (query, update) {
          try {
            return await collection.updateOne(query, update);
          } catch (err) {
            throw new Error(`Error in updateOne: ${err.message}`);
          }
        },
        insertOne: async function (document) {
          try {
            return await collection.insertOne(document);
          } catch (err) {
            throw new Error(`Error in insertOne: ${err.message}`);
          }
        },
      };
    },
  };
  async function connectDB() {
    try {
      await client.connect();
      console.log("Connected to MongoDB successfully with URI:", uri);
      db = cidkagenou;
      global.db = db;
    } catch (err) {
      console.error("MongoDB connection error, falling back to JSON:", err);
      db = null;
    }
  }
  connectDB();
} else {
  console.log("No mongoUri in config.json, it will be saved all as json. Config:", config);
  db = null;
  global.db = db;
}

loadBannedUsers();

const startBot = async () => {
  login({ appState }, (err, api) => {
    if (err) {
      console.error("Fatal error during Facebook login:", err);
      process.exit(1);
    }
    api.setOptions({
      forceLogin: true,
      listenEvents: true,
      logLevel: "silent",
      updatePresence: true,
      selfListen: false,
      bypassRegion: "PNB",
      userAgent: "Mozilla/5.0",
      online: false,
      autoMarkDelivery: false,
      autoMarkRead: false,
    });
    startListeningForMessages(api);
  });
};

const sendMessage = async (api, messageData) => {
  try {
    const { threadID, message, replyHandler, messageID, senderID } = messageData;
    if (!threadID || (typeof threadID !== "number" && typeof threadID !== "string" && !Array.isArray(threadID))) {
      throw new Error("ThreadID must be a number, string, or array and cannot be undefined.");
    }
    if (!message || message.trim() === "") return;
    return new Promise((resolve, reject) => {
      api.sendMessage(message, threadID, (err, info) => {
        if (err) {
          console.error("Error sending message:", err);
          return reject(err);
        }
        if (replyHandler && typeof replyHandler === "function") {
          global.Kagenou.replies[info.messageID] = { callback: replyHandler, author: senderID };
          setTimeout(() => {
            delete global.Kagenou.replies[info.messageID];
          }, 300000);
        }
        resolve(info);
      }, messageID || null);
    });
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

const handleMessage = async (api, event) => {
  const { threadID, senderID, body, messageReply } = event;
  if (!body) return;
  const message = body.trim();
  const words = message.split(/ +/);
  const prefix = config.Prefix[0];
  loadBannedUsers();
  if (bannedUsers[senderID]) {
    return api.sendMessage(`You are banned from using bot commands.\nReason: ${bannedUsers[senderID].reason}`, threadID);
  }
  if (messageReply && global.Kagenou.replies && global.Kagenou.replies[messageReply.messageID]) {
    return handleReply(api, event);
  }
  let commandName = words[0].toLowerCase();
  let args = words.slice(1);
  let command = null;
  if (message.startsWith(prefix)) {
    commandName = message.slice(prefix.length).split(/ +/)[0].toLowerCase();
    args = message.slice(prefix.length).split(/ +/).slice(1);
    command = commands.get(commandName);
  } else {
    command = nonPrefixCommands.get(commandName);
  }
  if (command) {
    try {
      if (command.execute) {
        await command.execute(api, event, args, commands, prefix, config.admins, appState, sendMessage, apiHandler, usersData, globalData);
      } else if (command.run) {
        await command.run({ api, event, args, apiHandler, usersData, globalData, admins: config.admins });
      }
    } catch (error) {
      console.error(`Failed to execute command '${commandName}':`, error);
      sendMessage(api, { threadID, message: `Error executing command '${commandName}': ${error.message}` });
    }
  } else {
    if (await tokitoSystem.executeCommand({ chat: api, event, args })) {
    } else if (await cidKagenouSystem.executeCommand({ cid: api, event, args })) {
    } else if (await ownirsv2System.executeCommand({ api, event, args })) {
    }
  }
};

const handleEvent = async (api, event) => {
  for (const command of eventCommands) {
    try {
      if (command.handleEvent) await command.handleEvent({ api, event });
    } catch (error) {
      console.error(`Error in event command '${command.config.name}':`, error);
    }
  }
};

const startListeningForMessages = (api) => {
  api.listenMqtt(async (err, event) => {
    if (err) {
      console.error("Error listening for messages:", err);
      return;
    }
    if (event.type === "message_reply" && event.messageReply) {
      if (global.Kagenou.replies[event.messageReply.messageID]) {
        await handleReply(api, event);
        return;
      }
      await handleEvent(api, event);
      await handleMessage(api, event);
    }
    if (["message"].includes(event.type)) {
      await handleEvent(api, event);
      await handleMessage(api, event);
    }
    if (event.type === "event" && event.logMessageType === "log:subscribe") {
      const threadID = event.threadID;
      const addedUsers = event.logMessageData.addedParticipants;
      if (addedUsers.some(user => user.userFbId === api.getCurrentUserID())) {
        return api.sendMessage(`Thank you for inviting me here!`, threadID);
      }
    }
  });
};

startBot();

module.exports = { handleMessage };