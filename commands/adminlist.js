module.exports = {
  name: 'adminlist',
  category: 'Info',
  description: 'show admins lists',
  version: '3.0.0',
  author: 'aljur pogoy',
  usage: 'adminlist',
  execute: async (api, event, args, commands, prefix, admins, appState, sendMessage) => {
    const { threadID } = event;
    let adminListMessage = "Admins 👑\n";

    for (const adminID of admins) {
      try {
        const userInfo = await api.getUserInfo(adminID);
        const userName = userInfo[adminID].name;
        adminListMessage += `-${userName} [ ${adminID} ]\n`;
      } catch (error) {
        console.error(`Error getting user info for admin ${adminID}:`, error);
        adminListMessage += `-Unknown User [ ${adminID} ]\n`;
      }
    }

    sendMessage(api, { threadID, message: adminListMessage });
  },
};