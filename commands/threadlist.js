// just nevermind the code arrangements but at least it worked 🥲

const { format, UNIRedux } = require("cassidy-styler");
module.exports = {
  name: "threadlist",
  author: "Aljur Pogoy",
  version: "4.0.0",
  description: "Display a list of threads with their names from the database. Usage: #threadlist",
  async run({ api, event, args, db }) {
    const { threadID, messageID } = event;
    try {
      if (!db) return api.sendMessage(format({ title: "Thread List", titlePattern: `{emojis} ${UNIRedux.arrow} {word}`, titleFont: "double_struck", contentFont: "fancy_italic", emojis: "📜", content: `❌ Database not initialized. Ensure MongoDB is connected and try again.\n> Contact bot admin if this persists.\n> Thanks for using Cid Kagenou bot` }), threadID, messageID);
      const threads = await db.db("threads").find({}).toArray();
      if (!threads || threads.length === 0) return api.sendMessage(format({ title: "Thread List", titlePattern: `{emojis} ${UNIRedux.arrow} {word}`, titleFont: "double_struck", contentFont: "fancy_italic", emojis: "📜", content: `❌ No threads found in the database.\n> Ensure the bot has interacted with threads to populate the database.\n> Thanks for using Cid Kagenou bot` }), threadID, messageID);
      const threadDetails = threads.map(thread => `${thread.threadID}: ${thread.name || `Unnamed Thread (ID: ${thread.threadID})`}`);
      const content = `📜 Thread List:\n${threadDetails.join("\n")}\n\nTotal Threads: ${threads.length}\n> Use #threadlist to refresh\n> Thanks for using Cid Kagenou bot`;
      await api.sendMessage(format({ title: "Thread List", titlePattern: `{emojis} ${UNIRedux.arrow} {word}`, titleFont: "double_struck", contentFont: "fancy_italic", emojis: "📜", content }), threadID, messageID);
    } catch (error) {
      api.sendMessage(format({ title: "Thread List", titlePattern: `{emojis} ${UNIRedux.arrow} {word}`, titleFont: "double_struck", contentFont: "fancy_italic", emojis: "📜", content: `┏━━━━━━━┓\n┃ Error: ${error.message}\n┗━━━━━━━┛\n> Thanks for using Cid Kagenou bot` }), threadID, messageID);
    }
  },
};