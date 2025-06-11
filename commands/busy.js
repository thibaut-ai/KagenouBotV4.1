const { format, UNIRedux } = require("cassidy-styler");

module.exports = {

  name: "busy",

  author: "Aljur Pogoy",

  version: "4.0.0",

  description: "Manage your busy status with custom messages to reply when mentioned. Usage: #busy add <message> | #busy remove <message>",

  usage: "#busy add Don't Mention me",

  async run({ api, event, args, db, usersData }) {

    const { threadID, messageID, senderID, mentions } = event;

    if (!usersData) {

      return api.sendMessage(

        format({

          title: "Busy",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "⚡",

          content: "Internal error: Data cache not initialized. Contact bot admin."

        }),

        threadID,

        messageID

      );

    }

    // Handle mention: Check if the user who set the busy message is mentioned

    if (mentions && Object.keys(mentions).length > 0) {

      // Look for the sender's ID in mentions (user who might have set a busy message)

      const mentionedIDs = Object.keys(mentions);

      for (const mentionedID of mentionedIDs) {

        const userData = usersData.get(mentionedID) || {};

        if (userData.busyMessages && userData.busyMessages.length > 0) {

          return api.sendMessage(

            userData.busyMessages[0], // Reply with the first busy message

            threadID,

            messageID

          );

        }

      }

      return; // No busy message for any mentioned user, do nothing

    }

    const subcommand = (args[0] || "").toLowerCase();

    // Handle subcommands

    if (subcommand === "add") {

      if (!args[1]) {

        return api.sendMessage(

          format({

            title: "Busy",

            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

            titleFont: "double_struck",

            emojis: "⚡",

            content: "Please provide a message!\nUse: #busy add <message>\nExample: #busy add Don't Mention me"

          }),

          threadID,

          messageID

        );

      }

      const message = args.slice(1).join(" ");

      let userData = usersData.get(senderID) || {};

      userData.busyMessages = userData.busyMessages || [];

      if (!userData.busyMessages.includes(message)) {

        userData.busyMessages.push(message);

        usersData.set(senderID, userData);

        if (db) {

          try {

            await db.db("users").updateOne(

              { userId: senderID },

              { $set: { userId: senderID, data: userData } },

              { upsert: true }

            );

          } catch (error) {

            // Silently handle DB error

          }

        }

        return api.sendMessage(

          format({

            title: "Busy",

            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

            titleFont: "double_struck",

            emojis: "⚡",

            content: `Added "${message}" to your busy messages!`

          }),

          threadID,

          messageID

        );

      }

      return api.sendMessage(

        format({

          title: "Busy",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "⚡",

          content: `"${message}" is already in your busy messages!`

        }),

        threadID,

        messageID

      );

    }

    if (subcommand === "remove") {

      if (!args[1]) {

        return api.sendMessage(

          format({

            title: "Busy",

            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

            titleFont: "double_struck",

            emojis: "⚡",

            content: "Please provide a message to remove!\nUse: #busy remove <message>\nExample: #busy remove Don't Mention me"

          }),

          threadID,

          messageID

        );

      }

      const message = args.slice(1).join(" ");

      let userData = usersData.get(senderID) || {};

      if (userData.busyMessages && userData.busyMessages.includes(message)) {

        userData.busyMessages = userData.busyMessages.filter(m => m !== message);

        usersData.set(senderID, userData);

        if (db) {

          try {

            await db.db("users").updateOne(

              { userId: senderID },

              { $set: { userId: senderID, data: userData } },

              { upsert: true }

            );

          } catch (error) {

            // Silently handle DB error

          }

        }

        return api.sendMessage(

          format({

            title: "Busy",

            titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

            titleFont: "double_struck",

            emojis: "⚡",

            content: `Removed "${message}" from your busy messages!`

          }),

          threadID,

          messageID

        );

      }

      return api.sendMessage(

        format({

          title: "Busy",

          titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

          titleFont: "double_struck",

          emojis: "⚡",

          content: `"${message}" is not in your busy messages!`

        }),

        threadID,

        messageID

      );

    }

    // Default response (show usage)

    return api.sendMessage(

      format({

        title: "Busy",

        titlePattern: `{emojis} ${UNIRedux.arrow} {word}`,

        titleFont: "double_struck",

        emojis: "⚡",

        content: "Usage:\n- #busy add <message>\n- #busy remove <message>\nExample: #busy add Don't Mention me"

      }),

      threadID,

      messageID

    );

  }

};