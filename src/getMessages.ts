import api from "./api"

/**
 * Used to differentiate between message types
 *
 * @example
 * if (message.type == MessageType.Tell) {
 * 	// ...
 * }
 */
export enum MessageType {
	Join, Leave, Send, Tell
}

/**
 * A message sent in a channel using "send"
 */
export type ChannelMessage = {
	id: string
	user: string
	type: MessageType.Join | MessageType.Leave | MessageType.Send
	content: string
	channel: string
	time: number
	toUsers: string[]
}

/**
 * A message sent in a tell using "tell"
 */
export type TellMessage = {
	id: string
	user: string
	type: MessageType.Tell
	content: string
	time: number
	toUser: string
}

/**
 * Gets you messages recieved from the given date to 10 minutes after the given date
 *
 * @param chatToken your chat token
 * @param usernames users you want to get messages for
 * @param after ruby timestamp (seconds since 1970) of start date to get messages from
 *
 * @returns a promise that resolves to an array of channel and tell messages
 *
 * @example hackmudChatAPI.getMessages("mr_bot", (Date.now() / 1000) - 60)
 */
export async function getMessages(chatToken: string, usernames: string | string[], after: number) {
	if (typeof usernames == "string")
		usernames = [ usernames ]

	const chats = (await api("chats", {
		chat_token: chatToken,
		usernames,
		after
	})).chats

	const idMessages = new Map<string, ChannelMessage | TellMessage>()

	for (const [ user, messages ] of Object.entries(chats)) {
		for (const message of messages) {
			const idMessage = idMessages.get(message.id)

			if ("channel" in message) {
				if (idMessage)
					(idMessage as ChannelMessage).toUsers.push(user)
				else {
					let type: MessageType

					if ("is_join" in message)
						type = MessageType.Join
					else if ("is_leave" in message)
						type = MessageType.Leave
					else
						type = MessageType.Send

					idMessages.set(message.id, {
						id: message.id,
						user: message.from_user,
						type,
						channel: message.channel,
						content: message.msg,
						time: message.t,
						toUsers: [ user ]
					})
				}
			} else {
				idMessages.set(message.id, {
					id: message.id,
					user: message.from_user,
					type: MessageType.Tell,
					content: message.msg,
					time: message.t,
					toUser: message.to_user
				})
			}
		}
	}

	return [ ...idMessages.values() ].sort((a, b) => a.time - b.time)
}

export default getMessages
