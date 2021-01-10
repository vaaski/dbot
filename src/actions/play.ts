import type { Action, NotifyChannel } from "../types"
import type { StreamOptions, TextChannel, VoiceChannel } from "discord.js"

import ytdl from "ytdl-core-discord"
import { constants, shared } from "../index"
import queue from "../queue"

const volume = shared.volume
const defaultSettings: StreamOptions = { type: "opus", volume }

export const play = (voiceChannel: VoiceChannel | undefined | null, video: string): Promise<void> =>
  new Promise(async (res) => {
    if (!voiceChannel) throw new Error("not in a voice channel")

    shared.connection = await voiceChannel.join()
    shared.dispatcher = shared.connection.play(await ytdl(video), defaultSettings)

    shared.dispatcher?.on("finish", res)
  })

export const notify = async (textChannel: NotifyChannel, playing: string) => {
  textChannel.startTyping()
  shared.playingNotification = await textChannel.send(`> playing ${playing}`)
  const { playpause, volDown, volUp, stop, earpain } = constants.emoji

  await shared.playingNotification.react(playpause)
  await shared.playingNotification.react(volDown)
  await shared.playingNotification.react(volUp)
  await shared.playingNotification.react(stop)
  await shared.playingNotification.react(earpain)
  textChannel.stopTyping()
}

const action: Action = {
  match: /^(?:play|p)\s(.+)/i,
  async handler(cmd, message) {
    const searchInput = this.match.exec(cmd)?.[1]

    try {
      if (!searchInput) throw new Error("no search input")

      shared.voiceChannel = message.member?.voice.channel
      shared.textChannel = message.channel as TextChannel

      await queue.add.call(queue, searchInput)
    } catch (error) {
      console.log(error)
      message.reply(`can't play ${searchInput}`)
    }
  },
}

export default action
