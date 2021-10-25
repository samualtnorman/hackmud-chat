import { serverDate } from "./api"
import getChannels from "./getChannels"
import { ChannelMessage, getMessages, TellMessage } from "./getMessages"
import getToken from "./getToken"
import sendMessage from "./sendMessage"
import tellMessage from "./tellMessage"

export type MessageHandler = (messages: (ChannelMessage | TellMessage)[]) => void
export type StartHandler = (token: string) => void

/**
 * Stores state so you don't have to
 */
export class Client {
	private token: string | null = null
	private time = Date.now() / 1000
	private startHandlers: StartHandler[] | null = []
	private messageHandlers: MessageHandler[] = []
	private users: string[] | null = null
	private timeout: NodeJS.Timeout | null = null
	private lastMessageId = ""

	constructor(tokenOrPass: string) {
		if (tokenOrPass.length == 5)
			getToken(tokenOrPass).then(token => this.init(token))
		else
			this.init(tokenOrPass)
	}

	/**
	 * Runs given callback upon starting
	 *
	 * @param startHandler callback
	 */
	onStart(startHandler: StartHandler) {
		if (!this.startHandlers)
			throw new Error("already started")

		this.startHandlers.push(startHandler)

		return this
	}

	/**
	 * Runs given callback for all messages that are recieved
	 *
	 * @param messageHandler callback
	 */
	onMessage(messageHandler: MessageHandler) {
		this.messageHandlers.push(messageHandler)

		if (!this.timeout) {
			if (this.users)
				this.startGetMessagesLoop()
			else
				this.onStart(() => this.startGetMessagesLoop())
		}

		return this
	}

	/**
	 * Tells a message to a user
	 *
	 * @param from your user
	 * @param to target user
	 * @param message to send
	 *
	 * @returns a promise that resolves when request to server is complete
	 */
	tellMessage(from: string, to: string, message: string) {
		if (this.token)
			return tellMessage(this.token, from, to, message)

		return new Promise<{ ok: true }>(resolve =>
			this.onStart(token => resolve(tellMessage(token, from, to, message)))
		)
	}

	/**
	 * Sends a message to a channel
	 *
	 * @param from your user
	 * @param channel target channel
	 * @param message to send
	 *
	 * @returns a promise that resolves when request to server is complete
	 */
	sendMessage(from: string, channel: string, message: string) {
		if (this.token)
			return sendMessage(this.token, from, channel, message)

		return new Promise<{ ok: true }>(resolve =>
			this.onStart(token => resolve(sendMessage(token, from, channel, message)))
		)
	}

	/**
	 * Gets you messages recieved from the given date to 10 minutes after the given date
	 *
	 * @param usernames users you want to get messages for
	 * @param after ruby timestamp (seconds since 1970) of start date to get messages from
	 *
	 * @returns a promise that resolves to an array of channel and tell messages
	 *
	 * @example hackmudChatAPI.getMessages("mr_bot", (Date.now() / 1000) - 60)
	 */
	getMessages(usernames: string | string[], after: number) {
		if (this.token)
			return getMessages(this.token, usernames, after)

		return new Promise<(ChannelMessage | TellMessage)[]>(resolve =>
			this.onStart(token => resolve(getMessages(token, usernames, after)))
		)
	}

	/**
	 * Gets you channels users are in
	 *
	 * @param mapChannels whether to also map the channels that other users are in
	 *
	 * @returns a promise that resolves to either a map of your users to the channels they are in
	 * @returns an object containing the prior and a map of channels to the users that are in them
	 */
	getChannels(mapChannels?: false): Promise<Map<string, string[]>>
	getChannels(mapChannels: true): Promise<{ users: Map<string, string[]>, channels: Map<string, string[]> }>
	getChannels(mapChannels = false) {
		if (this.token)
			return getChannels(this.token, mapChannels as any)

		return new Promise(resolve =>
			this.onStart(token => resolve(getChannels(token, mapChannels as any)))
		)
	}

	private async init(token: string) {
		this.token = token
		this.users = [ ...(await getChannels(token)).keys() ]

		for (const startHandler of this.startHandlers!)
			startHandler(token)

		this.startHandlers = null
	}

	private async startGetMessagesLoop() {
		if (!this.startHandlers)
			this.time = Date.now() / 1000

		this.getMessagesLoop()
		this.timeout = setTimeout(() => this.getMessagesLoop(), 2000)
	}

	private async getMessagesLoop() {
		const messages = await getMessages(this.token!, this.users!, this.time)

		if (messages.length) {
			if (messages[0].id == this.lastMessageId)
				messages.shift()

			if (messages.length) {
				const lastMessage = messages[messages.length - 1]

				this.time = lastMessage.time
				this.lastMessageId = lastMessage.id

				for (const messageHandler of this.messageHandlers)
					messageHandler(messages)
			} else
				this.time = serverDate.getTime() / 1000
		} else
			this.time = serverDate.getTime() / 1000

		this.timeout?.refresh()
	}
}

export default Client
