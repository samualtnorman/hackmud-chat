import api from "./api"

/** Send a message to a channel */
export const sendMessage = (chatToken: string, from: string, channel: string, message: string) =>
	api(`create_chat`, { chat_token: chatToken, username: from, channel, msg: message })

export default sendMessage
