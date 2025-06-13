/**
 * @author Aljur pogoy
 * Thank you for using our Botfile ✨
 */
require("ts-node").register();
require("./core/global");
const { MongoClient } = require("mongodb");
const fs = require("fs-extra");
const path = require("path");
const login = require("fbvibex");
const { handleAuroraCommand, loadAuroraCommands } = require("./core/aurora"); 
loadAuroraCommands
const commands = new Map();
const nonPrefixCommands = new Map();
const eventCommands = [];
const usersData = new Map();
const globalData = new Map();
const commandsDir = path.join(__dirname, "commands");
const bannedUsersFile = path.join(__dirname, "database", "bannedUsers.json");
const configFile = path.join(__dirname, "config.json");
const globalDataFile = path.join(__dirname, "database", "globalData.json");
let bannedUsers = {};
let config = { admins: [], moderators: [], developers: [], Prefix: ["#"], botName: "Shadow Garden Bot", mongoUri: null };
global.disabledCommands = new Map(); 
process.on("unhandledRejection", console.error.bind(console));
process.on("exit", () => fs.writeFileSync(globalDataFile, JSON.stringify([...globalData])));
global.userCooldowns = new Map();
const reloadCommands = () => {
  commands.clear();
  nonPrefixCommands.clear();
  eventCommands.length = 0;
  loadCommands();
};
global.reloadCommands = reloadCommands;
global.threadState = { active: new Map(), approved: new Map(), pending: new Map() };
global.client = { reactionListener: {}, globalData: new Map() };
global.Kagenou = { autodlEnabled: false, replies: {} };
if (fs.existsSync(globalDataFile)) {
  const data = JSON.parse(fs.readFileSync(globalDataFile));
  for (const [key, value] of Object.entries(data)) globalData.set(key, value);
}
const loadBannedUsers = () => {
  try {
    bannedUsers = JSON.parse(fs.readFileSync(bannedUsersFile, "utf8"));
  } catch {
    bannedUsers = {};
  }
};

function getUserRole(uid) {
  uid = String(uid);
  if (config.developers.includes(uid)) return 3;
  if (config.moderators.includes(uid)) return 2;
  if (config.admins.includes(uid)) return 1;
  return 0;
}

async function handleReply(api, event) {
  const replyData = global.Kagenou.replies[event.messageReply?.messageID];
  if (!replyData) return;
  if (replyData.author && event.senderID !== replyData.author) {
    return api.sendMessage("Only the original sender can reply to this message.", event.threadID, event.messageID);
  }
  try {
    await replyData.callback({ ...event, event, api, attachments: event.messageReply?.attachments || [], data: replyData });
    console.log(`[REPLY] Processed reply for messageID: ${event.messageReply?.messageID}, command: ${replyData.callback.name || "unknown"}`);
  } catch (err) {
    console.error(`[REPLY ERROR] Failed to process reply for messageID: ${event.messageReply?.messageID}:`, err);
    api.sendMessage(`An error occurred while processing your reply: ${err.message}`, event.threadID, event.messageID);
  }
}


const loadCommands = () => {
  const retroGradient = require("gradient-string").retro;
  const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js") || file.endsWith(".ts"));
  for (const file of commandFiles) {
    try {
      const commandPath = path.join(commandsDir, file);
      delete require.cache[require.resolve(commandPath)];
      const commandModule = require(commandPath);
      const command = commandModule.default || commandModule;
      if (command.config && command.config.name && command.run) {
        commands.set(command.config.name.toLowerCase(), command);
        if (command.config.aliases) command.config.aliases.forEach(alias => commands.set(alias.toLowerCase(), command));
        if (command.config.nonPrefix) nonPrefixCommands.set(command.config.name.toLowerCase(), command);
      } else if (command.name) {
        commands.set(command.name.toLowerCase(), command);
        if (command.aliases) command.aliases.forEach(alias => commands.set(alias.toLowerCase(), command));
        if (command.nonPrefix) nonPrefixCommands.set(command.name.toLowerCase(), command);
      }
      if (command.handleEvent) eventCommands.push(command);
    } catch (error) {
      console.error(`Error loading command '${file}':`, error);
    }
  }
  console.log(retroGradient(`[ MAIN SYSTEM COMMANDS ]: ${commands.size}`));
  console.log(retroGradient(`Non-Prefix Commands: ${nonPrefixCommands.size}`));
  console.log(retroGradient(`Event Commands: ${eventCommands.length}`));
  console.log(retroGradient("[ INFO ] Setup Complete!"));
};

loadCommands();
let appState = {};

try {
  appState = JSON.parse(fs.readFileSync("./appstate.dev.json", "utf8"));
} catch (error) {
  console.error("Error loading appstate.json:", error);
}
try {
  const configData = JSON.parse(fs.readFileSync(configFile, "utf8"));
  console.log("[CONFIG] Loaded config.json:", configData);
  config = {
    admins: configData.admins || [],
    moderators: configData.moderators || [],
    developers: configData.developers || [],
    Prefix: Array.isArray(configData.Prefix) && configData.Prefix.length > 0 ? configData.Prefix : ["#"],
    botName: configData.botName || "Shadow Garden Bot",
    mongoUri: configData.mongoUri || null,
    ...configData,
  };
} catch (error) {
  console.error("[CONFIG] Error loading config.json:", error);
  config = { admins: [], moderators: [], developers: [], Prefix: ["#"], botName: "Shadow Garden Bot", mongoUri: null };
}
let db = null;
const uri = config.mongoUri || null;
console.log("[DB] MongoDB URI:", uri);
if (uri) {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  const cidkagenou = {
    db: function (collectionName) {
      return client.db("chatbot_db").collection(collectionName);
    },
  };
  async function connectDB() {
    try {
      console.log("[DB] Attempting to connect to MongoDB...");
      await client.connect();
      console.log("[DB] Connected to MongoDB successfully with URI:", uri);
      db = cidkagenou;
      global.db = db;
      const usersCollection = db.db("users");
      const allUsers = await usersCollection.find({}).toArray();
      allUsers.forEach(user => usersData.set(user.userId, user.data));
      console.log("[DB] Synced usersData with MongoDB users.");
    } catch (err) {
      console.error("[DB] MongoDB connection error, falling back to JSON:", err);
      db = null;
      global.db = null;
    }
  }
  connectDB();
} else {
  console.log("[DB] No mongoUri in config.json, falling back to JSON storage. Config:", config);
  db = null;
  global.db = null;
}
loadBannedUsers();
const setCooldown = (userID, commandName, cooldown) => {
  const key = `${userID}:${commandName}`;
  global.userCooldowns.set(key, Date.now() + cooldown * 1000);
};
const checkCooldown = (userID, commandName, cooldown) => {
  const key = `${userID}:${commandName}`;
  const expiry = global.userCooldowns.get(key);
  if (expiry && Date.now() < expiry) {
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    return `Please wait ${remaining} second(s) before using '${commandName}' again.`;
  }
  return null;
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
          setTimeout(() => delete global.Kagenou.replies[info.messageID], 300000);
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
  const { threadID, senderID, body, messageReply, messageID } = event;
  if (!body) return;
  const message = body.trim();
  const words = message.split(/ +/);
  let prefixes = config.Prefix;
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
  let prefix = config.Prefix[0];
  for (const prefix of prefixes) {
    if (message.startsWith(prefix)) {
      commandName = message.slice(prefix.length).split(/ +/)[0].toLowerCase();
      args = message.slice(prefix.length).split(/ +/).slice(1);
      command = commands.get(commandName);
      if (command && command.nonPrefix && message === commandName) command = null;
      break;
    }
  }
  if (!command) {
    command = nonPrefixCommands.get(commandName);
  }
  if (command) {
    const userRole = getUserRole(senderID);
    const commandRole = command.role || 0;
    if (userRole < commandRole) {
      return api.sendMessage(
        ` You do not have permission to use this command. Required role: ${commandRole} (0=Everyone, 1=Admin, 2=Moderator, 3=Developer), your role: ${userRole}.`,
        threadID,
        messageID
      );
    }
    const disabledCommandsList = global.disabledCommands.get("disabled") || [];
    if (disabledCommandsList.includes(commandName)) {
      return api.sendMessage(`${commandName.charAt(0).toUpperCase() + commandName.slice(1)} Command has been disabled.`, threadID, messageID);
    }
    const cooldown = command.cooldown || 0;
    const cooldownMessage = checkCooldown(senderID, commandName, cooldown || 3);
    if (cooldownMessage) return sendMessage(api, { threadID, message: cooldownMessage, messageID });
    setCooldown(senderID, commandName, cooldown || 3);
    try {
      if (command.execute) {
        await command.execute(api, event, args, commands, prefix, config.admins, appState, sendMessage, usersData, globalData);
      } else if (command.run) {
        await command.run({ api, event, args, usersData, globalData, admins: config.admins, prefix: prefix, db });
      } else if (command.config && command.config.onStart) {
        await command.config.onStart({
          api,
          event,
          args,
          message: {
            reply: (text, callback) => api.sendMessage(text, event.threadID, callback, event.messageID)
          }
        });
      }
      if (db && usersData.has(senderID)) {
        const usersCollection = db.db("users");
        const userData = usersData.get(senderID) || {};
        await usersCollection.updateOne(
          { userId: senderID },
          { $set: { userId: senderID, data: userData } },
          { upsert: true }
        );
        console.log(`[DB] Synced user ${senderID} data to MongoDB.`);
      }
    } catch (error) {
      console.error(`Failed to execute command '${commandName}':`, error);
      sendMessage(api, { threadID, message: `Error executing command '${commandName}': ${error.message}` });
    }
  } else if (message.startsWith(config.Prefix[0])) {
    sendMessage(api, { threadID, message: `Invalid Command!, Use ${config.Prefix[0]}help for available commands.`, messageID });
  }
};
async function handleReaction(api, event) {
  const { threadID, reaction, messageID, senderID } = event;
  for (const command of commands.values()) {
    if (command.handleReaction) {
      try {
        await command.handleReaction({ api, event, reaction, threadID, messageID, senderID });
        console.log(`[REACTION] Processed reaction for command: ${command.config?.name || "unknown"}`);
      } catch (error) {
        console.error(`[REACTION] error:`, error);
        api.sendMessage(`Error processing reaction: ${error.message}`, threadID, messageID);
      }
    } else if (command.config && command.config.onReaction) {
      const reactionData = global.Kagenou.replies[event.messageID] || {};
      if (reactionData.author === event.senderID) {
        try {
          await command.config.onReaction({
            message: { reply: (text) => api.sendMessage(text, event.threadID) },
            event,
            Reaction: reactionData,
          });
          delete global.Kagenou.replies[event.messageID];
        } catch (error) {
          console.error(`[REACTION ERROR] Failed to process reaction for '${command.config.name}':`, error);
          api.sendMessage(`Error processing reaction: ${error.message}`, event.threadID, event.messageID);
        }
      }
    }
  }
}
const handleEvent = async (api, event) => {
  for (const command of eventCommands) {
    try {
      if (command.handleEvent) await command.handleEvent({ api, event });
    } catch (error) {
      console.error(`Error in event command '${command.config?.name || command.name}':`, error);
    }
  }
};
const startListeningForMessages = (api) => {
  return api.listenMqtt(async (err, event) => {
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
      handleAuroraCommand(api, event);
    }
    if (event.type === "event" && event.logMessageType === "log:subscribe") {
      const threadID = event.threadID;
      const addedUsers = event.logMessageData.addedParticipants || [];
      console.log("Added participants:", addedUsers);
      console.log("Bot's user ID:", api.getCurrentUserID());
      const botWasAdded = addedUsers.some(user => user.userFbId === api.getCurrentUserID());
      if (botWasAdded) {
        console.log(`Bot was added to thread ${threadID}`);
        if (db) {
          try {
            const threadInfo = await api.getThreadInfo(threadID);
            const threadName = threadInfo.name || `Unnamed Thread (ID: ${threadID})`;
            await db.db("threads").updateOne(
              { threadID },
              { $set: { threadID, name: threadName } },
              { upsert: true }
            );
            console.log(`[ThreadList] Saved thread ${threadID}: ${threadName} to MongoDB`);
          } catch (error) {
            console.error(`[ThreadList] Failed to save thread ${threadID} to MongoDB:`, error);
          }
        } else {
          console.warn("[ThreadList] Database not initialized, cannot save thread info");
        }
        if (
          !global.threadState.active.has(threadID) &&
          !global.threadState.approved.has(threadID) &&
          !global.threadState.pending.has(threadID)
        ) {
          global.threadState.pending.set(threadID, { addedAt: new Date() });
          console.log(`Added thread ${threadID} to pending state`);
          api.sendMessage(`Thank you for inviting me here! ThreadID: ${threadID}`, threadID);
          try {
            await api.changeNickname(config.botName, threadID, api.getCurrentUserID());
            console.log(`Nickname changed to ${config.botName} in thread ${threadID}`);
          } catch (error) {
            console.error(`Failed to change nickname in thread ${threadID}:`, error);
          }
        }
      }
    }
   if (event.type === "message_reaction") {
      await handleReaction(api, event);
    }
    if (event.type === "message" && event.body && event.body.startsWith(config.Prefix[0])) {
      const words = event.body.trim().split(/ +/);
      const commandName = words[0].slice(config.Prefix[0].length).toLowerCase();
      const args = words.slice(1);
      if (commandName === "approve" && config.admins.includes(event.senderID)) {
        if (args[0] && args[0].toLowerCase() === "pending") return;
        if (args.length > 0) {
          const targetThreadID = args[0].trim();
          if (/^\d+$/.test(targetThreadID) || /^-?\d+$/.test(targetThreadID)) {
            if (global.threadState.pending.has(targetThreadID)) {
              global.threadState.pending.delete(targetThreadID);
              global.threadState.approved.set(targetThreadID, { approvedAt: new Date() });
              console.log(`Approved thread ${targetThreadID}`);
              api.sendMessage(`Thread ${targetThreadID} has been approved.`, event.threadID);
              api.sendMessage(`Bot was approved by Admins to start type ${config.Prefix[0]}`, targetThreadID, (err) => {
                if (err) console.error(`Failed to send approval notification to thread ${targetThreadID}:`, err);
                else console.log(`Sent approval notification to thread ${targetThreadID}`);
              });
            } else if (!global.threadState.approved.has(targetThreadID)) {
              global.threadState.approved.set(targetThreadID, { approvedAt: new Date() });
              console.log(`Directly approved thread ${targetThreadID}`);
              api.sendMessage(`Thread ${targetThreadID} has been approved.`, event.threadID);
              api.sendMessage(`Bot was approved by Admins to start type ${config.Prefix[0]}`, targetThreadID, (err) => {
                if (err) console.error(`Failed to send approval notification to thread ${targetThreadID}:`, err);
                else console.log(`Sent approval notification to thread ${targetThreadID}`);
              });
            }
          }
        }
      }
    }
  });
};

const startListeningWithAutoRestart = (api) => {
  let stopListener = null;
  const startListener = () => {
    if (stopListener) {
      stopListener();
      console.log("Stopped previous listener to prevent duplicates.");
    }
    try {
      stopListener = startListeningForMessages(api);
      console.log("Started new listener.");
    } catch (err) {
      console.error("Failed to start listener, retrying in 5 seconds:", err);
      setTimeout(startListener, 5000);
    }
  };
  startListener();
  setInterval(() => {
    console.log("Scheduled listener restart...");
    startListener();
  }, 3600000);
};

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard', 'public')));

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
      selfListen: true,
      bypassRegion: "pnb",
      userAgent: "ZmFjZWJvb2tleHRlcm5hbGhpdC8xLjEgKCtodHRwOi8vd3d3LmZhY2Vib29rLmNvbS9leHRlcm5hbGhpdF91YXRleHQucGhwKQ==",
      online: true,
      autoMarkDelivery: false,
      autoMarkRead: false,
    });

    // Set global API instance
    global.api = api;

    // Start listening
    startListeningWithAutoRestart(api);

    // Serve portfolio with bot info
    app.get('/', (req, res) => {
      const botUID = api.getCurrentUserID();
      const botName = config.botName || 'Shadow Garden Bot';
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>ᯓ★ Bot Portfolio</title>
            <meta name="description" content="Portfolio of the Shadow Garden Bot.">
            <meta property="og:image" content="https://i.imgur.com/jPAVdEs.jpeg">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="icon" href="/image/home.png">
            <style>
                body {
                    font-family: 'Courier Prime', monospace;
                    background: url('https://i.imgur.com/jPAVdEs.jpeg') no-repeat center center fixed;
                    background-size: cover;
                    color: #fff;
                    margin: 0;
                    padding: 0;
                }
                .navbar {
                    background-color: #343a40;
                }
                .navbar-brand img {
                    margin-right: 10px;
                }
                .navbar-nav .nav-link {
                    color: #fff !important;
                }
                .container {
                    padding: 20px;
                    background: rgba(0, 0, 0, 0.7);
                    border-radius: 10px;
                    margin-top: 20px;
                }
                .card {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #fff;
                }
                .card-title {
                    font-size: 24px;
                    font-weight: bold;
                }
                .card-text {
                    font-size: 16px;
                }
                .footer {
                    text-align: center;
                    padding: 10px;
                    background: #343a40;
                    position: fixed;
                    bottom: 0;
                    width: 100%;
                }
                #scrollUpBtn {
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background-color: #007bff;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    color: #fff;
                    font-size: 20px;
                    cursor: pointer;
                    display: none;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                #scrollUpBtn.show {
                    display: block;
                    opacity: 1;
                }
                #scrollUpBtn.hide {
                    opacity: 0;
                }
                .text-danger {
                    color: #dc3545;
                }
            </style>
        </head>
        <body>
            <nav class="navbar navbar-expand-lg navbar-dark">
                <a class="navbar-brand" href="/">
                    <img src="/image/home.png" alt="Home" style="width: 30px; height: auto;">
                </a>
                <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse justify-content-end" id="navbarNav" style="margin-right: 70px;">
                    <ul class="navbar-nav">
                        <li class="nav-item active">
                            <a class="nav-link" href="/">Portfolio <span class="sr-only">(current)</span></a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/tos-privacy-policy">Terms</a>
                        </li>
                    </ul>
                </div>
            </nav>
            <div class="container">
                <h1 class="col text-center" style="font-size: 20px; padding: 10px;">Bot Portfolio</h1>
                <p style="font-size: 10px; text-align: center;">Version: 1.0.1</p>
                <div class="card mt-4">
                    <div class="card-body">
                        <h5 class="card-title">${botName}</h5>
                        <p class="card-text">UID: ${botUID}</p>
                        <p class="card-text">Status: Active</p>
                        <p class="card-text">Prefix: ${config.Prefix[0] || '#'}</p>
                        <img src="https://via.placeholder.com/150" alt="Bot Profile" class="img-fluid mt-3" style="max-width: 150px;">
                    </div>
                </div>
            </div>
            <br><br>
            <div>
                <br>
                <button id="scrollUpBtn"><i class="fa-solid fa-angles-up"></i></button>
                <div class="footer">
                    <p>© 2024 Kaizenji | All rights reserved.</p>
                    <p>Time: <span id="time"></span> | Ping: <span id="ping"></span></p>
                </div>
            </div>
            <script>
                window.addEventListener('scroll', () => {
                    const scrollUpBtn = document.getElementById('scrollUpBtn');
                    if (window.scrollY > 300) {
                        scrollUpBtn.classList.add('show');
                        scrollUpBtn.classList.remove('hide');
                    } else {
                        scrollUpBtn.classList.add('hide');
                        scrollUpBtn.classList.remove('show');
                    }
                });
                document.getElementById('scrollUpBtn').addEventListener('click', () => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
                function updateTime() {
                    const now = new Date();
                    document.getElementById('time').textContent = now.toLocaleTimeString();
                }
                setInterval(updateTime, 1000);
                updateTime();
                document.getElementById('ping').textContent = 'N/A';
            </script>
            <script src="https://code.jquery.com/jquery-3.5.1.slim.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"></script>
            <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/js/all.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        </body>
        </html>
      `);
    });

    const dashboardPort = 3000;
    app.listen(dashboardPort, () => {
      console.log(`[DASHBOARD] Dashboard running on http://localhost:${dashboardPort}`);
    });
  });
};
startBot();
