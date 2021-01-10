import type * as Discord from "discord.js"

import { validateURL, getVideoID } from "ytdl-core-discord"
import { constants, shared } from "."
import queue from "./queue"

const botId = process.env.DISCORD_BOT_ID

export type User = Discord.User | Discord.PartialUser
type Reaction = Discord.MessageReaction

export default async (reaction: Reaction, user: User) => {
  let { message } = reaction
  if (user.id === botId) return
  if (message.partial) message = await message.fetch()
  if (reaction.message.author.id !== botId) return

  const { embeds } = reaction.message
  if (embeds?.[0]?.url && validateURL(embeds[0].url)) {
    reaction.message.delete()

    shared.voiceChannel = user.presence?.member?.voice.channel
    shared.textChannel = reaction.message.channel as Discord.TextChannel

    queue.add.call(queue, embeds[0].url)

    return
  }

  const { playpause, volDown, volUp, stop } = constants.emoji

  switch (reaction.emoji.name) {
    case playpause:
      const { dispatcher } = shared
      if (dispatcher?.paused) dispatcher.resume()
      else dispatcher?.pause()
      break
    case volDown:
      shared.volume = Math.max(0.01, shared.volume - 0.01)
      shared.dispatcher?.setVolume(shared.volume)
      break
    case volUp:
      shared.volume = Math.min(1, shared.volume + 0.01)
      shared.dispatcher?.setVolume(shared.volume)
      break
    case stop:
      shared.dispatcher?.destroy()
      shared.connection?.disconnect()
      shared.playingNotification?.delete()
      break
    case "bruh":
      const volume = shared.dispatcher?.volume

      if (volume && volume > 1) shared.dispatcher?.setVolume(shared.volume)
      else shared.dispatcher?.setVolume(999)
      break
  }
}
