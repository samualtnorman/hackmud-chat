# hackmud-chat-api
![Build Test](https://github.com/samualtnorman/hackmud-chat-api/workflows/Build%20Test/badge.svg)

Typed hackmud chat API wrapper for node and browsers with built in rate limiting.

example:
```js
const { Client, MessageKind } = require("@samual/hackmud-chat-api")

const MY_USER = "mr_bot" // this should be one of your users
const MY_TOKEN = "91w6zc1teswMyIG2QJag" // this can also be your chat pass

const client = new Client(MY_TOKEN, [ ...(await getChannelData(MY_TOKEN)).users.keys() ])

client.onStart(token => {
    console.log("my token is", token)
})

client.onMessage(messages => {
    for (const message of messages) {
        if (message.kind == MessageKind.Tell && message.content == "ping")
            client.tellMessage(MY_USER, message.user, "pong!")
    }
})

client.sendMessage(MY_USER, "0000", "hello, I am a bot")
```
