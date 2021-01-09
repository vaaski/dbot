import type { Action } from "./types"

import * as Discord from "discord.js"
import actions from "./actions"

const prefix = process.env.COMMAND_PREFIX
const commandSplitter = process.env.COMMAND_SPLITTER

const splitterRegex = new RegExp(`\\s+${commandSplitter}\\s+`)
const botRegex = new RegExp(`^${prefix}(?:\\s?)(.+)`, "i")
const removePrefixReg = new RegExp(`^${prefix}\\s?`, "i")

const client = new Discord.Client()
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

console.log("starting discord bot")
client.login(process.env.DISCORD_TOKEN)
