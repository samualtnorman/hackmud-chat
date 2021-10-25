import api from "./api"

/**
 * Tells a message to a user
 *
 * @param chatToken your chat token
 * @param from your user
 * @param to target user
 * @param message to send
 *
 * @returns a promise that resolves when request to server is complete
 */
export function tellMessage(chatToken: string, from: string, to: string, message: string) {
	return api("create_chat", { chat_token: chatToken, username: from, tell: to, msg: message })
}

export default tellMessage
