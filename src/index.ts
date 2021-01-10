import type { Action, NotifyChannel } from "./types"

import * as Discord from "discord.js"

const prefix = process.env.COMMAND_PREFIX
const commandSplitter = process.env.COMMAND_SPLITTER

const splitterRegex = new RegExp(`\\s+${commandSplitter}\\s+`)
const botRegex = new RegExp(`^${prefix}(?:\\s?)(.+)`, "i")
const removePrefixReg = new RegExp(`^${prefix}\\s?`, "i")

interface Shared {
  voiceChannel: undefined | null | Discord.VoiceChannel
  textChannel: undefined | null | NotifyChannel
  connection: undefined | null | Discord.VoiceConnection
  dispatcher: undefined | null | Discord.StreamDispatcher
  playingNotification: undefined | null | Discord.Message
  volume: number
}
export const shared: Shared = {
  voiceChannel: undefined,
  textChannel: undefined,
  connection: undefined,
  dispatcher: undefined,
  playingNotification: undefined,
  volume: 0.05,
}

export const constants = {
  emoji: {
    volDown: "🔉",
    volUp: "🔊",
    playpause: "⏯️",
    skip: "⏭️",
    stop: "⏹️",
    earpain: "639199486396203017",
  },
}

import actions from "./actions"
import reactionHandler from "./reactionHandler"

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
  message.delete().catch((reason) => console.log(`cant delete command message ${reason}`))
})

client.on("messageReactionAdd", reactionHandler)
client.on("messageReactionRemove", reactionHandler)

console.log("starting discord bot")
client.login(process.env.DISCORD_TOKEN)
