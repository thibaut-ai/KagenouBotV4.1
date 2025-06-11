module.exports = {
  name: "tid",
  nonPrefix: true,
  description: "Check the bot's response time (latency).",
  usage: "tid",
  version: "4.0.0",
  async run({ api, event }) {
    const { threadID, messageID } = event;
    const startTime = Date.now();
    const sendMessage = await api.sendMessage("Jas wait sir!!!...", threadID, messageID);
    const latency = Date.now() - startTime;
    return api.sendMessage(` THREAD ID: ${threadID}\n\n Latency is ${latency}ms`, threadID, sendMessage.messageID);
  }
};