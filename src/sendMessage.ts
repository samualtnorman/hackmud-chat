import api from "./api";

/**
 * Sends a message to a channel
 *
 * @param chatToken your chat token
 * @param from your user
 * @param channel target channel
 * @param message to send
 *
 * @returns a promise that resolves when request to server is complete
 */
export function sendMessage(chatToken: string, from: string, channel: string, message: string) {
	return api("create_chat", { chat_token: chatToken, username: from, channel, msg: message })
}

export default sendMessage
