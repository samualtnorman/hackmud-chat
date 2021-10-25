import api from "./api"

/**
 *
 * @param pass your pass recieved using `chat_pass`
 *
 * @returns a promise that resolves to a chat token
 */
export async function getToken(pass: string) {
	return (await api("get_token", { pass })).chat_token
}

export default getToken
