import api from "./api"

/** Tell a message to a user */
export const tellMessage = (chatToken: string, from: string, to: string, message: string): Promise<{ ok: true }> =>
	api(`create_chat`, { chat_token: chatToken, username: from, tell: to, msg: message })

export default tellMessage
