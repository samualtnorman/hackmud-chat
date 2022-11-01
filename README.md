# Hackmud Chat

Typed hackmud chat API wrapper for node and browsers with built in rate limiting.
Also a command `hackmud-chat` for turning a pass into a token and viewing chat.

## Turning Your Chat Pass Into a Chat Token

1. Make sure you have the command installed `npm install -g @samual/hackmud-chat`
1. Run the command `hackmud-chat get-token <chat pass>`

## Viewing hackmud Chat in Your Terminal
1. Run `hackmud-chat`
1. Type in your chat token you got from the above process

## Chat Bot Example
```js
const { Client, MessageKind, getChannelData } = require("@samual/hackmud-chat")

const MY_USER = "mr_bot" // this should be one of your users
const MY_TOKEN = "91w6zc1teswMyIG2QJag"

(async () => {
    const client = new Client(MY_TOKEN, [ ...(await getChannelData(MY_TOKEN)).users.keys() ])

    client.onMessages(messages => {
        for (const message of messages) {
            if (message.kind == MessageKind.Tell && message.content == "ping")
                client.tellMessage(MY_USER, message.user, "pong!")
        }
    })

    client.sendMessage(MY_USER, "0000", "hello, I am a bot")
})()
```
