#!/bin/node
/* eslint-disable prefer-named-capture-group */
import writeFilePersistent from "@samual/lib/writeFilePersistent"
import chalk from "chalk"
import { readFileSync } from "fs"
import inquirer from "inquirer"
import { homedir as getHomeDirectory, platform as getPlatform } from "os"
import { isTokenValid } from "../api"
import Client from "../Client"
import getChannelData from "../getChannelData"
import { Message, MessageKind } from "../getMessages"
import getToken from "../getToken"

if (process.argv.length > 2) {
	if (process.argv[2] == `get-token`) {
		if (!process.argv[3]) {
			console.error(`Missing chat pass argument`)
			process.exit(1)
		}

		console.log(await getToken(process.argv[3]))
		process.exit(0)
	}

	console.error(`Unknown command "${process.argv[2]}"`)
	process.exit(1)
}

const colourCodesToChalks = {
	0: chalk.rgb(0xCA, 0xCA, 0xCA),
	1: chalk.rgb(0xFF, 0xFF, 0xFF),
	2: chalk.rgb(0x1E, 0xFF, 0x00),
	3: chalk.rgb(0x00, 0x70, 0xDD),
	4: chalk.rgb(0xB0, 0x35, 0xEE),
	5: chalk.rgb(0xFF, 0x80, 0x00),
	6: chalk.rgb(0xFF, 0x80, 0x00),
	7: chalk.rgb(0xFF, 0x80, 0x00),
	8: chalk.rgb(0xFF, 0x80, 0x00),
	9: chalk.rgb(0xFF, 0x80, 0x00),
	a: chalk.rgb(0x00, 0x00, 0x00),
	b: chalk.rgb(0x3F, 0x3F, 0x3F),
	c: chalk.rgb(0x67, 0x67, 0x67),
	d: chalk.rgb(0x7D, 0x00, 0x00),
	e: chalk.rgb(0x8E, 0x34, 0x34),
	f: chalk.rgb(0xA3, 0x4F, 0x00),
	g: chalk.rgb(0x72, 0x54, 0x37),
	h: chalk.rgb(0xA8, 0x86, 0x00),
	i: chalk.rgb(0xB2, 0x93, 0x4A),
	j: chalk.rgb(0x93, 0x95, 0x00),
	k: chalk.rgb(0x49, 0x52, 0x25),
	l: chalk.rgb(0x29, 0x94, 0x00),
	m: chalk.rgb(0x23, 0x38, 0x1B),
	n: chalk.rgb(0x00, 0x53, 0x5B),
	o: chalk.rgb(0x32, 0x4A, 0x4C),
	p: chalk.rgb(0x00, 0x73, 0xA6),
	q: chalk.rgb(0x38, 0x5A, 0x6C),
	r: chalk.rgb(0x01, 0x00, 0x67),
	s: chalk.rgb(0x50, 0x7A, 0xA1),
	t: chalk.rgb(0x60, 0x1C, 0x81),
	u: chalk.rgb(0x43, 0x31, 0x4C),
	v: chalk.rgb(0x8C, 0x00, 0x69),
	w: chalk.rgb(0x97, 0x39, 0x84),
	x: chalk.rgb(0x88, 0x00, 0x24),
	y: chalk.rgb(0x76, 0x2E, 0x4A),
	z: chalk.rgb(0x10, 0x12, 0x15),
	A: chalk.rgb(0xFF, 0xFF, 0xFF),
	B: chalk.rgb(0xCA, 0xCA, 0xCA),
	C: chalk.rgb(0x9B, 0x9B, 0x9B),
	D: chalk.rgb(0xFF, 0x00, 0x00),
	E: chalk.rgb(0xFF, 0x83, 0x83),
	F: chalk.rgb(0xFF, 0x80, 0x00),
	G: chalk.rgb(0xF3, 0xAA, 0x6F),
	H: chalk.rgb(0xFB, 0xC8, 0x03),
	I: chalk.rgb(0xFF, 0xD8, 0x63),
	J: chalk.rgb(0xFF, 0xF4, 0x04),
	K: chalk.rgb(0xF3, 0xF9, 0x98),
	L: chalk.rgb(0x1E, 0xFF, 0x00),
	M: chalk.rgb(0xB3, 0xFF, 0x9B),
	N: chalk.rgb(0x00, 0xFF, 0xFF),
	O: chalk.rgb(0x8F, 0xE6, 0xFF),
	P: chalk.rgb(0x00, 0x70, 0xDD),
	Q: chalk.rgb(0xA4, 0xE3, 0xFF),
	R: chalk.rgb(0x00, 0x00, 0xFF),
	S: chalk.rgb(0x7A, 0xB2, 0xF4),
	T: chalk.rgb(0xB0, 0x35, 0xEE),
	U: chalk.rgb(0xE6, 0xC4, 0xFF),
	V: chalk.rgb(0xFF, 0x00, 0xEC),
	W: chalk.rgb(0xFF, 0x96, 0xE0),
	X: chalk.rgb(0xFF, 0x00, 0x70),
	Y: chalk.rgb(0xFF, 0x6A, 0x98),
	Z: chalk.rgb(0x0C, 0x11, 0x2B)
}

const greyTrustDots = colourCodesToChalks.b(`:::`)
const tellFrom = colourCodesToChalks.N(`from`)
const mentionAt = colourCodesToChalks.C(`@`)

const userChalks = [
	colourCodesToChalks.J, colourCodesToChalks.K, colourCodesToChalks.M,
	colourCodesToChalks.W, colourCodesToChalks.L, colourCodesToChalks.B
]

const trustUsers = new Set([
	`accts`, `autos`, `binmat`, `chats`, `corps`, `escrow`, `gui`,
	`kernel`, `market`, `scripts`, `sys`, `trust`, `users`
])

const tokenFilePath =
	`${getHomeDirectory()}/${getPlatform() == `win32` ? `AppData/Roaming` : `.config`}/hackmud-chat/token.txt`

let token

try {
	token = readFileSync(tokenFilePath, { encoding: `utf-8` })
} catch (error) {
	if ((error as NodeJS.ErrnoException).code != `ENOENT`)
		throw error
}

if (!(token && await isTokenValid(token))) {
	({ token } = await inquirer.prompt([
		{ name: `token`, validate: async token => (await isTokenValid(token)) ? true : `Expired or invalid token` }
	]))

	writeFilePersistent(tokenFilePath, token)
}

const client = new Client(token, [ ...(await getChannelData(token)).users.keys() ])

for (const message of await client.getMessagesBefore(new Date()))
	console.log(printMessage(message))

client.onMessages(messages => {
	for (const message of messages)
		console.log(printMessage(message))
})

function printMessage(message: Message) {
	const date = colourCodesToChalks.C(
		String(message.date.getHours()).padStart(2, `0`) + String(message.date.getMinutes()).padStart(2, `0`)
	)

	const channel = message.kind == MessageKind.Tell
		? tellFrom
		: (message.kind == MessageKind.Join || message.kind == MessageKind.Leave
			? colourCodesToChalks.N(message.channel)
			: colourCodesToChalks.V(message.channel)
		)

	const user = colourUser(message.sender)

	return `${date} ${channel} ${user} ${greyTrustDots}${colourMessageContent(message.content)}${greyTrustDots}`
}

function colourMessageContent(message: string) {
	return colourCodesToChalks.S(
		message
			.replace(/DATA_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/g, substring =>
				colourCodesToChalks.q(substring)
			)
			.replace(/KIN_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/g, substring =>
				colourCodesToChalks.N(substring)
			)
			.replace(/FORM_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/g, substring =>
				colourCodesToChalks.l(substring)
			)
			.replace(/VOID_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/g, substring =>
				colourCodesToChalks.I(substring)
			)
			.replace(/CHAOS_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/g, substring =>
				colourCodesToChalks.D(substring)
			)
			.replace(/CHOICE_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/g, substring =>
				colourCodesToChalks.F(substring)
			)
			.replace(/(?:HJG|VNP|NGC|K|SPC)_\d{4}/g, substring => colourCodesToChalks.C(substring))
			.replace(
				/@([a-z_][a-z_\d]{0,24})(?![a-z_\d])/g,
				(_, user) => mentionAt + colourUser(user)
			)
			.replace(
				/([a-z_][a-z\d_]{0,24})\.([a-z_][a-z\d_]{0,24})/g,
				(_, user, name) => `${
					trustUsers.has(user) ? colourCodesToChalks.F(user) : colourCodesToChalks.C(user)
				}.${
					colourCodesToChalks.L(name)
				}`
			)
			.replace(
				/([a-zA-Z_]\w*|"(?:\\"|[^"])+")( {0,2}: {0,2})("(?:\\"|[^"])+"|\d+|true|false|{|\[)/g,
				(_, key, middle, value) => colourCodesToChalks.N(key) + middle + colourCodesToChalks.V(value)
			)
			.replace(/`([^\W_])([^`\n]+)`/g, (_, colourCode, inner) => (colourCodesToChalks as any)[colourCode](inner))
	)
}

function colourUser(user: string) {
	let hash = 0

	for (const char of user)
		hash += (hash >> 1) + hash + `xi1_8ratvsw9hlbgm02y5zpdcn7uekof463qj`.indexOf(char) + 1

	return userChalks[hash % userChalks.length]!(user)
}
