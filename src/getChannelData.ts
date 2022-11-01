import assert from "@samual/lib/assert"
import api from "./api"

/** Get channels your users are in and other users in those channels */
export async function getChannelData(chatToken: string) {
	assert(chatToken.length == 20, `\`chatToken\` argument must be 20 characters`)

	const { users: usersData } = await api(`account_data`, { chat_token: chatToken })
	const users = new Map<string, string[]>()
	const channels = new Map<string, string[]>()

	for (const [ user, channelsData ] of Object.entries(usersData)) {
		users.set(user, Object.keys(channelsData))

		for (const [ channel, users ] of Object.entries(channelsData)) {
			if (!channels.get(channel))
				channels.set(channel, users)
		}
	}

	return { users, channels }
}

export default getChannelData
