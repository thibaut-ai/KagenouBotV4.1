const fs = require("fs-extra");

const path = require("path");

const commandsDir = path.join(__dirname, "commands");

const configPath = path.join(__dirname, "config.json");

let config = {};

let commands = new Map();

let cooldowns = new Map(); 

try {

    config = JSON.parse(fs.readFileSync(configPath, "utf8"));

} catch (error) {

    console.error("❌ Error loading ownirsv2-system config.json:", error);

}



const getLang = (key, commandName, ...args) => {

    const lang = config.language || "en"; // Default to English

    const langData = commands.get(commandName)?.langs?.[lang] || {};

    let text = langData[key] || key;

    args.forEach((arg, i) => {

        text = text.replace(`%${i + 1}`, arg);

    });

    return text;

};



const loadCommands = () => {

    if (!fs.existsSync(commandsDir)) {

        console.warn("⚠️ ownirsv2-system commands directory not found.");

        return;

    }

    const commandFiles = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {

        try {

            const command = require(path.join(commandsDir, file));

            if (command.config && command.config.name && command.onStart) {

                commands.set(command.config.name.toLowerCase(), command);

            }

        } catch (error) {

            console.error(`❌ Error loading ownirsv2-system command '${file}':`, error);

        }

    }

};

loadCommands();

console.log("✅ ownirsv2-system Commands loaded:", [...commands.keys()]);



const executeCommand = async ({ api, event, args }) => {

    const { body, threadID, senderID } = event;

    if (!body) return false;

    const message = body.trim();

    const prefix = config.prefix || "#"; // Default prefix if not set in config

    if (!message.startsWith(prefix)) return false;

    const commandName = message.slice(prefix.length).split(/ +/)[0].toLowerCase();

    const commandArgs = message.slice(prefix.length).split(/ +/).slice(1);

    const command = commands.get(commandName);

    if (!command) return false;

    const { config: cmdConfig } = command;

    const cooldownKey = `${senderID}_${cmdConfig.name}`;

    const now = Date.now();

    const cooldownTime = (cmdConfig.countDown || 0) * 1000; // Cooldown in seconds

    

    if (cooldowns.has(cooldownKey)) {

        const expiration = cooldowns.get(cooldownKey);

        if (now < expiration) {

            const timeLeft = Math.ceil((expiration - now) / 1000);

            api.sendMessage(`⏳ Please wait ${timeLeft} second(s) before using "${cmdConfig.name}" again.`, threadID);

            return true;

        }

    }

   

    if (cmdConfig.role && cmdConfig.role > 0) {

        const isAdmin = config.admins?.includes(senderID);

        if (!isAdmin) {

            api.sendMessage(`❌ You don't have permission to use "${cmdConfig.name}".`, threadID);

            return true;

        }

    }

    try {

       

        if (cooldownTime > 0) {

            cooldowns.set(cooldownKey, now + cooldownTime);

            setTimeout(() => cooldowns.delete(cooldownKey), cooldownTime);

        }


        const message = {

            reply: (msg) => api.sendMessage(msg, threadID),

            send: (msg) => api.sendMessage(msg, threadID)

        };

        

        await command.onStart({

            api,

            event,

            args: commandArgs,

            message,

            getLang: (key, ...args) => getLang(key, cmdConfig.name, ...args)

        });

        return true;

    } catch (error) {

        api.sendMessage(`❌ Error executing ownirsv2-system command: ${error.message}`, threadID);

        return false;

    }

};

module.exports = {

    executeCommand,

    config,

    commands

};
