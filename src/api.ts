import { request } from "https"
import { wait } from "./lib"

export type JSONValue = string | number | boolean | JSONValue[] | { [key: string]: JSONValue } | null
export type APIResponse = Record<string, JSONValue> & { ok: true }

export type RawMessage = {
	id: string
	t: number
	from_user: string
	msg: string
}

export type RawChannelMessage = RawMessage & { channel: string }
export type RawTellMessage = RawMessage & { to_user: string }
export type RawJoinMessage = RawChannelMessage & { is_join: true }
export type RawLeaveMessage = RawChannelMessage & { is_leave: true }

export let serverDate: Date

/**
 * Make a raw API call
 */
export function api(method: "create_chat", args: {
	chat_token: string
	username: string
	tell: string
	msg: string
}, retries?: number, retryWaitTimeMilliseconds?: number): Promise<{
	ok: true
}>
export function api(method: "create_chat", args: {
	chat_token: string
	username: string
	channel: string
	msg: string
}, retries?: number, retryWaitTimeMilliseconds?: number): Promise<{
	ok: true
}>
export function api(method: "chats", args: {
	chat_token: string
	usernames: string[]
	before: number
}, retries?: number, retryWaitTimeMilliseconds?: number): Promise<{
	ok: true
	chats: Record<string, (RawTellMessage | RawChannelMessage | RawJoinMessage | RawLeaveMessage)[]>
}>
export function api(method: "chats", args: {
	chat_token: string
	usernames: string[]
	after: number
}, retries?: number, retryWaitTimeMilliseconds?: number): Promise<{
	ok: true
	chats: Record<string, (RawTellMessage | RawChannelMessage | RawJoinMessage | RawLeaveMessage)[]>
}>
export function api(method: "account_data", args: {
	chat_token: string
}, retries?: number, retryWaitTimeMilliseconds?: number): Promise<{
	ok: true
	users: Record<string, Record<string, string[]>>
}>
export function api(method: "get_token", args: {
	pass: string
}, retries?: number, retryWaitTimeMilliseconds?: number): Promise<{
	ok: true
	chat_token: string
}>
export function api(method: string, args: object, retries = 4, retryWaitTimeMilliseconds = 1000) {
	const buffers: Buffer[] = []

	return new Promise<APIResponse>((resolve, reject) => {
		request({
			method: "POST",
			hostname: "www.hackmud.com",
			path: `/mobile/${method}.json`,
			headers: { "Content-Type": "application/json" }
		}, res => res
			.on("data", (buffer: Buffer) => buffers.push(buffer))
			.on("end", () => {
				serverDate = new Date(res.headers.date!)

				if (res.statusCode == 401)
					return reject(new Error("expired or invalid token"))

				// if (res.statusCode != 200)
				// 	return reject(new Error(`got status code '${res.statusCode}'`))

				if (!res.headers["content-type"])
					return reject(new Error("missing content-type in headers"))

				const mimeType = res.headers["content-type"].toLowerCase().match(/(.+);/)![1]

				if (mimeType != "application/json")
					return reject(new Error(`server response mime type was '${mimeType}'`))

				const response = JSON.parse(Buffer.concat(buffers).toString()) as APIResponse | { ok: false, msg: string }

				if (response.ok)
					resolve(response)
				else
					reject(new Error(response.msg))

			})
		).end(JSON.stringify(args))
	}).catch(async reason => {
		if (!retries)
			throw reason

		console.error(reason)
		await wait(retryWaitTimeMilliseconds)
		return api(method as any, args as any, retries - 1, retryWaitTimeMilliseconds)
	})
}

export default api
