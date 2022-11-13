import assert from "@samual/lib/assert"
import api from "./api"

/**
 * Get messages recieved in the 30 minutes `"before"` or `"after"` a `Date`
 *
 * @param users users you want to get recieved messages for
 * @param when defaults to `"after"`
 */
export async function getMessages(chatToken: string, users: string[], date: Date, when: "before" | "after" = `after`): Promise<Message[]> {
	assert(chatToken.length == 20, `\`chatToken\` argument must be 20 characters`)
	assert(users.length, `\`users\` argument must not be empty`)

	const { chats, invalid_usernames: invalidUsers } =
		await api(`chats`, { chat_token: chatToken, usernames: users, [when]: Number(date) / 1000 } as any)

	if (invalidUsers)
		throw new Error(`Invalid users: ${invalidUsers.join(`, `)}`)

	const idsToMessages = new Map<string, Message>()

	for (const [ user, messages ] of Object.entries(chats)) {
		for (const message of messages) {
			const idMessage = idsToMessages.get(message.id)

			if (`channel` in message) {
				if (idMessage) {
					(idMessage as ChannelMessage).receivers.push(user)

					continue
				}

				idsToMessages.set(message.id, {
					id: message.id,
					sender: message.from_user,

					kind: `is_join` in message
						? MessageKind.Join
						: (`is_leave` in message ? MessageKind.Leave : MessageKind.Send),

					channel: message.channel,
					content: message.msg,
					date: new Date(message.t * 1000),
					receivers: [ user ]
				})

				continue
			}

			idsToMessages.set(message.id, {
				id: message.id,
				sender: message.from_user,
				kind: MessageKind.Tell,
				content: message.msg,
				date: new Date(message.t * 1000),
				receiver: message.to_user
			})
		}
	}

	return [ ...idsToMessages.values() ].sort((a, b) => Number(a.date) - Number(b.date))
}

export default getMessages

/**
 * Differentiate between kinds of messages
 *
 * @example
 * switch (message.kind) {
 *     case MessageKind.Join: {
 *         // ...
 *     } break
 *
 *     case MessageKind.Leave: {
 *         // ...
 *     } break
 *
 *     case MessageKind.Send: {
 *         // ...
 *     } break
 *
 *     case MessageKind.Tell: {
 *         // ...
 *     } break
 * }
 */
export enum MessageKind {
	Join, Leave, Send, Tell
}

/** Either a {@link ChannelMessage} or a {@link TellMessage} */
export type Message = ChannelMessage | TellMessage

/**
 * A message sent to a channel
 *
 * @example
 * if (message.kind != MessageKind.Tell) {
 *     // ...
 * }
 */
export type ChannelMessage = {
	kind: MessageKind.Join | MessageKind.Leave | MessageKind.Send
	id: string
	sender: string
	content: string
	channel: string
	date: Date
	receivers: string[]
}

/**
 * A message sent to a user
 *
 * @example
 * if (message.kind == MessageKind.Tell) {
 *     // ...
 * }
 */
export type TellMessage =
	{ kind: MessageKind.Tell, id: string, sender: string, content: string, date: Date, receiver: string }
