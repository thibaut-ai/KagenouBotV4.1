module.exports = {

    name: 'addadmin',

    category: 'Admin',
    description: 'Add admins to bot',
    author: 'aljur pogoy',
    version: '3.0.0',
    usage: '${prefix} addadmin <uid>',

    execute: async (api, event, args, commands, prefix, admins, appState, sendMessage) => {

        const { threadID, senderID } = event;

        const newAdminID = args[0];

        if (!admins.includes(senderID)) {

            return sendMessage(api, {

                threadID,

                message: '❌ You are not an admin.',

            });

        }

        if (!newAdminID || isNaN(newAdminID)) {

            return sendMessage(api, {

                threadID,

                message: '⚠ Please provide a valid user ID to add as an admin.',

            });

        }

        if (admins.includes(newAdminID)) {

            return sendMessage(api, {

                threadID,

                message: '⚠ This user is already an admin.',

            });

        }

        admins.push(newAdminID);

        sendMessage(api, {

            threadID,

            message: `✅ Successfully added ${newAdminID} as an admin.`,

        });

    },

};