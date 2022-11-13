import { serverDate } from "./api"
import getChannelData, { ChannelData } from "./getChannelData"
import { getMessages, Message } from "./getMessages"
import sendMessage from "./sendMessage"
import tellMessage from "./tellMessage"

export type MessagesHandler = (messages: Message[]) => void

/**
 * @example
 * const client = new Client(TOKEN, [ ...(await getChannelData(TOKEN)).users.keys() ])
 */
export class Client {
	private readonly messagesHandlers: MessagesHandler[] = []

	constructor(public token: string, public users: string[]) {}

	/**
	 * Calls callback with recieved messages
	 *
	 * @example
	 * client.onMessages(messages => {
	 *     // ...
	 * })
	 */
	onMessages(messagesHandler: MessagesHandler): this {
		this.messagesHandlers.push(messagesHandler)

		if (this.messagesHandlers.length == 1) {
			(async () => {
				const lastBatchIDs = new Set()
				let date = serverDate

				while (true) {
					const messages =
					// eslint-disable-next-line no-await-in-loop
						(await this.getMessagesAfter(date)).filter(message => !lastBatchIDs.has(message.id))

					lastBatchIDs.clear()

					if (messages.length) {
						for (const message of messages)
							lastBatchIDs.add(message.id)

						for (const messageHandler of this.messagesHandlers)
							messageHandler(messages)

						const lastMessageDate = messages[messages.length - 1]!.date

						date = lastMessageDate > serverDate ? lastMessageDate : serverDate
					} else
						date = serverDate
				}
			})()
		}

		return this
	}

	/** Get channels your users are in and other users in those channels */
	getChannelData(): Promise<ChannelData> {
		return getChannelData(this.token)
	}

	/** Get messages recieved in the 30 minutes after a date */
	getMessagesAfter(date: Date, users = this.users): Promise<Message[]> {
		return getMessages(this.token, users, date)
	}

	/** Get messages recieved in the 30 minutes before a date */
	getMessagesBefore(date: Date, users = this.users): Promise<Message[]> {
		return getMessages(this.token, users, date, `before`)
	}

	/** Send a message to a channel */
	sendMessage(from: string, channel: string, message: string): Promise<{ ok: true }> {
		return sendMessage(this.token, from, channel, message)
	}

	/** Tell a message to a user */
	tellMessage(from: string, to: string, message: string): Promise<{ ok: true }> {
		return tellMessage(this.token, from, to, message)
	}
}

export default Client
