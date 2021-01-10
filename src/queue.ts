import type internal from "stream"

import { StreamOptions, VoiceConnection } from "discord.js"
import ytdl from "ytdl-core-discord"
import { isURL } from "./util"
import { shared } from "."
import { URL } from "url"
import { searchYouTube } from "./actions/search"
import { notify } from "./actions/play"
import { createReadStream } from "fs"
import { join } from "path"

interface QueueItem {
  title: string
  stream: internal.Readable | string
  options?: StreamOptions
}

interface Queue {
  add(input: string | internal.Readable, title?: string): Promise<void>
  playNext(force?: boolean): Promise<any>
  playing: undefined | QueueItem
  list: QueueItem[]
}

type PlayFile = (type: "startup" | "shutdown", connection: VoiceConnection) => Promise<void>

const playFile: PlayFile = (type, connection) =>
  new Promise(async (res) => {
    const stream = createReadStream(join(__dirname, `../assets/${type}.webm`))

    shared.dispatcher = connection.play(stream, { type: "webm/opus", volume: shared.volume })
    shared.dispatcher.on("finish", res)
  })

const queue: Queue = {
  add(input, title) {
    const ctx = this

    return new Promise(async (res) => {
      if (typeof input === "string") {
        if (ytdl.validateID(input)) {
          const stream = await ytdl(input)
          ctx.list.push({ stream, title: input, options: { type: "opus" } })
        } else if (isURL(input)) {
          const { host } = new URL(input)
          title = title || `from ${host}`

          ctx.list.push({ stream: input, title })
        } else {
          const { title, url } = await searchYouTube(input)
          const stream = await ytdl(url)

          ctx.list.push({ stream, title, options: { type: "opus" } })
        }
      } else {
        title = title || "something"
        ctx.list.push({ stream: input, title })
      }
      res()

      ctx.playNext()
    })
  },
  async playNext(force) {
    if (this.playing && !force) return

    this.playing = this.list.shift()
    if (!this.playing) {
      if (shared.connection) await playFile("shutdown", shared.connection)

      shared.dispatcher?.destroy()
      shared.connection?.disconnect()
      shared.dispatcher = undefined
      shared.connection = undefined
      return
    }
    if (!shared.voiceChannel) {
      if (shared.textChannel) return shared.textChannel.send("you're not in a voice channel.")
      return console.log("no voice channel found")
    }

    // if (shared.playingNotification) await shared.playingNotification.delete()
    // if (shared.textChannel) notify(shared.textChannel, this.playing.title)

    if (!shared.connection) {
      shared.connection = await shared.voiceChannel.join()
      await playFile("startup", shared.connection)
    }

    const options = { volume: shared.volume, ...this.playing.options }
    shared.dispatcher = shared.connection.play(this.playing.stream, options)

    shared.dispatcher.on("finish", () => {
      this.playing = undefined
      this.playNext.call(this)
    })
  },
  playing: undefined,
  list: [],
}

export default queue
