const util = require("util");
const axios = require("axios");
module.exports = {
  name: "compile",
  description: "Compile a JavaScript code",
  author: "Aljur Pogoy",
  role: 3,
  async run({ api, event, args }) {
    const { threadID, messageID, senderID, attachments } = event;
    let code = args.join(" ").trim();
    if (event.messageReply && event.messageReply.body) {
      code = event.messageReply.body;
    }
    if (!code) {
      return api.sendMessage("Please provide JavaScript code to compile", threadID, messageID);
    }
    const logs = [];
    const customConsole = {
      log: (...args) => {
        logs.push(`[log] ${args.join(" ")}`);
      },
      error: (...args) => {
        logs.push(`[error] ${args.join(" ")}`);
      },
      warn: (...args) => {
        logs.push(`[warn] ${args.join(" ")}`);
      },
      info: (...args) => {
        logs.push(`[info] ${args.join(" ")}`);
      },
      debug: (...args) => {
        logs.push(`[debug] ${args.join(" ")}`);
      },
    };
    const attachment = async (url, message = "") => {
      try {
        const response = await axios.get(url, { responseType: "stream" });
        const result = await api.sendMessage(
          { body: message, attachment: response.data },
          threadID,
          messageID
        );
        return result;
      } catch (error) {
        return api.sendMessage(message || `Error sending attachment: ${error.message}`, threadID, messageID);
      }
    };
    const message = {
      reply: (text, callback) => api.sendMessage(text, threadID, callback, messageID),
    };
    const originalSendMessage = api.sendMessage;
    const sandbox = {
      api,
      event,
      args,
      threadID,
      messageID,
      senderID,
      attachments: attachments || [],
      message,
      console: customConsole,
      util,
      axios,
      attachment,
      require,
      process,
      setTimeout,
      setInterval,
      setImmediate,
      clearTimeout,
      clearInterval,
      clearImmediate,
      cidkagenou: global.db,
    };
    try {
      const result = await new Function("sandbox", `
        with (sandbox) {
          return (async () => {
            return eval(\`${code}\`);
          })();
        }
      `)(sandbox);
      let formattedResult = "";
      if (result !== undefined) {
        formattedResult = typeof result !== "string" ? util.inspect(result, { depth: 2 }) : result;
      }
      let response = "";
      if (logs.length > 0) {
        response += `Logs:\n${logs.join("\n")}\n`;
      }
      if (formattedResult) {
        response += `Compiled Output:\n${formattedResult}\n`;
      }
      await api.sendMessage(response || "Code executed with no output.", threadID, messageID);
    } catch (error) {
      let response = `❌ Compilation Error: ${error.message}`;
      if (logs.length > 0) {
        response = `Logs:\n${logs.join("\n")}\n\n${response}`;
      }
      await api.sendMessage(response, threadID, messageID);
      await api.setMessageReaction("❌", messageID, () => {});
    } finally {
      api.sendMessage = originalSendMessage;
    }
  },
};
