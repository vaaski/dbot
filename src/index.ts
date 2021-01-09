import type { Action } from "./types"

import * as Discord from "discord.js"
import { validateURL, getVideoID } from "ytdl-core-discord"

const prefix = process.env.COMMAND_PREFIX
const commandSplitter = process.env.COMMAND_SPLITTER
const botId = process.env.DISCORD_BOT_ID

const splitterRegex = new RegExp(`\\s+${commandSplitter}\\s+`)
const botRegex = new RegExp(`^${prefix}(?:\\s?)(.+)`, "i")
const removePrefixReg = new RegExp(`^${prefix}\\s?`, "i")

interface Shared {
  connection: undefined | Discord.VoiceConnection
  dispatcher: undefined | Discord.StreamDispatcher
  playingNotification: undefined | Discord.Message
  volume: number
}
export const shared: Shared = {
  connection: undefined,
  dispatcher: undefined,
  playingNotification: undefined,
  volume: 0.2,
}

export const constants = {
  emoji: {
    volDown: "🔉",
    volUp: "🔊",
    playpause: "⏯️",
    stop: "⏹️",
  },
}

import actions from "./actions"
import { notify, play } from "./actions/play"

const client = new Discord.Client({ partials: ["MESSAGE", "CHANNEL", "REACTION"] })
client.once("ready", () => {
  console.log("bot connected")
})

client.on("message", async (message) => {
  if (message.author.bot) return

  const { cleanContent, channel } = message

  if (!botRegex.exec(cleanContent)) return

  const commands = cleanContent.split(splitterRegex)
  const cleanedCommands = commands.map((c) => c.replace(removePrefixReg, ""))

  for (const command of cleanedCommands) {
    const action = actions.find((cmd: Action) => cmd.match.exec(command))
    if (!action) return channel.send("command not found")

    await action.handler(command, message)
  }
})

type User = Discord.User | Discord.PartialUser
type Reaction = Discord.MessageReaction
const handleReaction = async (reaction: Reaction, user: User) => {
  let { message } = reaction
  if (user.id === botId) return
  if (message.partial) message = await message.fetch()
  if (reaction.message.author.id !== botId) return

  const { embeds } = reaction.message
  if (embeds?.[0]?.url && validateURL(embeds[0].url)) {
    const videoId = getVideoID(embeds[0].url)
    reaction.message.delete()

    const voiceChannel = user.presence?.member?.voice.channel
    if (!voiceChannel) return
    notify(reaction.message.channel, "video")
    await play(voiceChannel, videoId)
    shared.playingNotification?.delete()
    voiceChannel?.leave()
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
      shared.volume = Math.max(0.05, shared.volume - 0.05)
      shared.dispatcher?.setVolume(shared.volume)
      break
    case volUp:
      shared.volume = Math.min(1, shared.volume + 0.05)
      shared.dispatcher?.setVolume(shared.volume)
      break
    case stop:
      shared.dispatcher?.destroy()
      shared.connection?.disconnect()
  }
}
client.on("messageReactionAdd", handleReaction)
client.on("messageReactionRemove", handleReaction)

console.log("starting discord bot")
client.login(process.env.DISCORD_TOKEN)
