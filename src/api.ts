/* eslint-disable require-atomic-updates */
import { assert, ensure } from "@samual/lib/assert"
import createLock from "@samual/lib/createLock"
import fetch from "@samual/lib/fetch"
import retry from "@samual/lib/retry"
import wait from "@samual/lib/wait"

export type RawMessage = RawChannelMessage | RawJoinMessage | RawLeaveMessage | RawTellMessage
export type RawChannelMessage = { id: string, t: number, from_user: string, msg: string, channel: string }
export type RawJoinMessage = RawChannelMessage & { is_join: true }
export type RawLeaveMessage = RawChannelMessage & { is_leave: true }
export type RawTellMessage = { id: string, t: number, from_user: string, msg: string, to_user: string }

const lock = createLock()
let lastAPICallTime = 0

export let serverDate = new Date()

/** Make raw API call */
export function api(
	method: "create_chat",

	args:
		{ chat_token: string, username: string, tell: string, msg: string } |
		{ chat_token: string, username: string, channel: string, msg: string }
): Promise<{ ok: true }>

export function api(
	method: "chats",

	args:
		{ chat_token: string, usernames: string[], before: number } |
		{ chat_token: string, usernames: string[], after: number }
): Promise<{ ok: true, chats: Record<string, RawMessage[]>, invalid_usernames?: string[] }>

export function api(method: "account_data", args: { chat_token: string }):
	Promise<{ ok: true, users: Record<string, Record<string, string[]>> }>

export function api(method: "get_token", args: { pass: string }): Promise<{ ok: true, chat_token: string }>

export function api(method: string, args: Record<string, unknown>): Promise<{ ok: true }> {
	return lock(async () => {
		const url = `https://www.hackmud.com/mobile/${method}.json`

		const fetchOptions =
			{ method: `POST`, headers: { "Content-Type": `application/json` }, body: JSON.stringify(args) }

		await wait((method == `account_data` ? 5000 : 2000) - (Date.now() - lastAPICallTime))

		try {
			const response = await retry(() => fetch(url, fetchOptions))

			serverDate = new Date(ensure(response.headers.get(`date`), `Server response headers did not have date`))

			if (response.status == 401)
				throw new Error(`Expired or invalid token`)

			const responseBodyText = await response.text()

			assert(responseBodyText, `Response body empty, got status code ${response.status}`)

			const responseBody =
				JSON.parse(responseBodyText) as { ok: true } | { ok: false, msg: string }

			if (responseBody.ok)
				return responseBody

			throw new Error(responseBody.msg)
		} finally {
			lastAPICallTime = Date.now()
		}
	})
}

export default api

export function isTokenValid(token: string) {
	if (token.length != 20)
		return false

	return lock(async () => {
		const fetchOptions: RequestInit = { method: `POST`, headers: { "Content-Type": `application/json` }, body: JSON.stringify({ chat_token: token, usernames: [], after: 0 }) }

		await wait(2000 - (Date.now() - lastAPICallTime))

		try {
			const response = await retry(() => fetch(`https://www.hackmud.com/mobile/chats.json`, fetchOptions))

			if (response.status == 401)
				return false

			assert(await response.text() == `{"ok":false,"msg":"no valid usernames were provided","invalid_usernames":[]}`)

			return true
		} finally {
			lastAPICallTime = Date.now()
		}
	})
}
