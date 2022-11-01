import api from "./api"

/** Convert a chat pass into a chat token */
export const getToken = async (pass: string) => (await api(`get_token`, { pass })).chat_token

export default getToken
