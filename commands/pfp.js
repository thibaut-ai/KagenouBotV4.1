module.exports = {
  config: {
    name: "pfp",
    aliases: ["profilepic", "avatar"],
    category: "utility",
    role: 0,
  },
  async run({ api, event, args }) {
    const { threadID, messageID } = event;

    try {
      let targetID;
      if (event.messageReply && event.messageReply.senderID) {
        targetID = event.messageReply.senderID;
      } else if (args[0]) {
        targetID = args[0];
      } else {
        targetID = event.senderID;
      }

      const userInfo = await api.getUserInfo(targetID);
      const pfpUrl = userInfo[targetID].profileUrl || `https://graph.facebook.com/${targetID}/picture?type=large`;

      await api.sendMessage(
        `Here’s the profile picture link for user ID ${targetID}: ${pfpUrl}`,
        threadID,
        messageID
      );
    } catch (error) {
      console.error(`Error fetching profile picture: ${error.message}`);
      await api.sendMessage(
        "Sorry, I couldn’t fetch the profile picture. Make sure you’re replying to a message or provide a valid user ID!",
        threadID,
        messageID
      );
    }
  }
};
