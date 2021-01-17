import { Action } from "../types"
import { auth, search, track } from "opentidal"
import queue from "../queue"

const refresh_token = process.env.TIDAL_REFRESH_TOKEN as string
const client_id = process.env.TIDAL_CLIENT_ID as string
const client_secret = process.env.TIDAL_CLIENT_SECRET as string
let access_token: string

auth.useRefreshToken({ client_id, client_secret, refresh_token }).then((token) => {
  access_token = token.access_token
  console.log("tidal authenticated")
})

const tidal: Action = {
  match: /^(?:tidal|td|t)\s(.+)/i,
  async handler(cmd, message) {
    if (!access_token) return message.reply("openTIDAL not initialized yet.")
    const query = this.match.exec(cmd)?.[1] as string

    const result = await search.tracks({ client_id, query, limit: 1 })
    const stream = await track.stream({ access_token, id: result.items[0].id })

    const item = result.items[0]
    const title = `${item.artist.name} - ${item.title}`
    queue.add(stream.urls[0], title)
  },
}

export default tidal
