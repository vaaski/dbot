import type { Action } from "../types"
import type { TextChannel } from "discord.js"

import { shared } from "../index"
import queue from "../queue"

const action: Action = {
  match: /^(?:play|p)\s(.+)/i,
  async handler(cmd, message) {
    const searchInput = this.match.exec(cmd)?.[1]

    try {
      if (!searchInput) throw new Error("no search input")

      await queue.add.call(queue, searchInput)
    } catch (error) {
      console.log(error)
      shared.textChannel?.send(`can't play ${searchInput}`)
    }
  },
}

export default action
