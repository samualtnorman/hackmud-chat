import api from "./api"

/**
 * Gets you channels users are in
 *
 * @param chatToken your chat token
 * @param mapChannels whether to also map the channels that other users are in
 *
 * @returns a promise that resolves to either a map of your users to the channels they are in
 * @returns an object containing the prior and a map of channels to the users that are in them
 */
export async function getChannels(chatToken: string, mapChannels?: false): Promise<Map<string, string[]>>
export async function getChannels(chatToken: string, mapChannels: true): Promise<{ users: Map<string, string[]>, channels: Map<string, string[]> }>
export async function getChannels(chatToken: string, mapChannels = false) {
	const usersData = (await api("account_data", { chat_token: chatToken })).users
	const users = new Map<string, string[]>()
	const channels = new Map<string, string[]>()

	for (let user in usersData) {
		const channelsData = usersData[user]

		users.set(user, Object.keys(channelsData))

		if (mapChannels) {
			for (const channel in channelsData) {
				if (!channels.get(channel))
					channels.set(channel, channelsData[channel])
			}
		}
	}

	if (mapChannels)
		return { users, channels }

	return users
}

export default getChannels
