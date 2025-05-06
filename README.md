
# KagenouBot V3 - The Seven Shadows

Welcome to **KagenouBot V3**, an elite Facebook Messenger bot inspired by *The Eminence in Shadow*. This multi-system bot is built with flexibility, speed, and customization in mind. Featuring unique command systems like **Tokito-System**, **Jinwoo-System**, **VIP-System**, and **Cid-Kagenou-System**, KagenouBot is your ultimate companion in automating and enhancing chat experiences.

---

## Introduction: The Seven Shadows

The Seven Shadows are Cid Kagenou's elite shadow organization. Each member possesses unique skills and plays a crucial role in his grand schemes.

### King of Shadow Garden

| Name              | Image                      | Description |
|-------------------|----------------------------|-------------|
| Cid Kagenou (Shadow) | ![Shadow](image/Shadow.jpg) | Shadow is the king of the Seven Shadows and leader of Shadow Garden. A brilliant tactician and a true mastermind hidden behind a humble facade. |

### Members of the Seven Shadows

| Member Name | Image                   | Description |
|-------------|-------------------------|-------------|
| Alpha       | ![Alpha](image/Alpha.jpg) | Alpha is the strongest and most loyal member, a powerful magic swordsman who leads the Seven Shadows. |
| Beta        | ![Beta](image/Beta.jpg)  | The strategist and tactician of the group, calm and calculating. |
| Gamma       | ![Gamma](image/Gamma.jpg) | A martial arts expert and voice of reason, swift and deadly in close combat. |
| Delta       | ![Delta](image/Delta.jpg) | An expert archer known for her loyalty and deadly precision. |
| Epsilon     | ![Epsilon](image/Epsilon.jpg) | Master of illusion and deception, clever and manipulative. |
| Zeta        | ![Zeta](image/Zeta.jpg)  | A stealthy assassin skilled in infiltration and hand-to-hand combat. |
| Eta         | ![Eta](image/Eta.jpg)   | A compassionate healer and expert in life magic. |

---

## Command System Examples

### Basic Command Format

```js
module.exports = {
  name: 'test',
  category: 'Test',
  execute: async (api, event, args, commands, prefix, admins, appState, sendMessage) => {
    sendMessage(api, { threadID: event.threadID, message: 'This is a test command!' });
  },
};
```

### Tokito-System Command

```js
module.exports = {
  manifest: {
    name: "ping",
    aliases: ["p"],
    developer: "YourName",
    description: "Responds with Pong!",
    usage: "/ping",
    config: {
      botAdmin: false,
      botModerator: false,
      noPrefix: false,
      privateOnly: false
    }
  },

  async deploy({ chat }) {
    chat.send("Pong! ðŸ“");
  }
};
```

### Jinwoo-System (Coming Soon in KagenouBotV3)

```js
module.exports = {
  config: {
    name: "ping",
    description: "Check bot response time.",
    usage: "/ping",
    hasPermission: 0
  },

  onStart: async function ({ api, event }) {
    const start = Date.now();
    api.sendMessage("ðŸ“ Pinging...", event.threadID, (err, info) => {
      if (err) return;
      const ping = Date.now() - start;
      api.editMessage(`ðŸ“ Pong! Response time: ${ping}ms`, info.messageID);
    });
  }
};
```

### VIP-System Command

```js
module.exports = {
  name: "ping",
  run: async ({ api, event }) => {
    api.sendMessage("Pong!", event.threadID);
  }
};
```

### Cid-Kagenou-System Command

```js
module.exports = {
  onChat: {
    name: "ping",
    aliases: ["latency", "pong"],
    developer: "Aljur Pogoy",
    description: "Check the bot's response time.",
    usage: "ping",
    config: {
      cidControl: false,
      alphaControl: false,
      deltaControl: false,
      zetaControl: false
    },
  },

  async deploy({ cid }) {
    const start = Date.now();
    await cid.kagenou("ðŸ“ Pinging...");
    const ping = Date.now() - start;
    cid.kagenou(`ðŸ“ Pong! Response time: ${ping}ms`);
  }
};
```

---

## Configuration Guide

### config.json
```json
{
  "admins": ["100073129302064", "100080383844941", "61560407754490"]
}
```

### appstate.json
> Put your appstate credentials here. **(Not recommended to use your main account)**

```json
{}
```

---

## Running the Bot

### Installation

```
npm install
```

### Start Bot

```
node index.js
```

> Login required via [Render](https://render.com)

---

## License

```
MIT License

Copyright (c) January 20, 2025
Aljur Pogoy / GeoArchonsTeam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, distribute, and publish as needed.
```

---

## Credits

- **ws3-fca** - [Visit NPM](https://www.npmjs.com/package/ws3-fca)
- **Shadow Garden Lore** - Inspired by *The Eminence in Shadow*
- **Bot Devs** - Aljur Pogoy and GeoArchonsTeam
