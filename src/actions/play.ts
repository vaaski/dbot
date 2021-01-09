import type { Action } from "../types"
import type { DMChannel, NewsChannel, StreamOptions, TextChannel, VoiceChannel } from "discord.js"

import ytdl from "ytdl-core-discord"
import { searchYouTube } from "./search"
import { constants, shared } from "../index"

const volume = shared.volume
const defaultSettings: StreamOptions = { type: "opus", volume }

export const play = (voiceChannel: VoiceChannel | undefined | null, video: string): Promise<void> =>
  new Promise(async (res) => {
    if (!voiceChannel) throw new Error("not in a voice channel")

    shared.connection = await voiceChannel.join()
    shared.dispatcher = shared.connection.play(await ytdl(video), defaultSettings)

    shared.dispatcher?.on("finish", res)
  })

type NotifyChannel = TextChannel | DMChannel | NewsChannel
export const notify = async (textChannel: NotifyChannel, playing: string) => {
  textChannel.startTyping()
  shared.playingNotification = await textChannel.send(`> playing ${playing}`)
  const { playpause, volDown, volUp, stop, earrape } = constants.emoji

  await shared.playingNotification.react(playpause)
  await shared.playingNotification.react(volDown)
  await shared.playingNotification.react(volUp)
  await shared.playingNotification.react(stop)
  await shared.playingNotification.react(earrape)
  textChannel.stopTyping()
}

const action: Action = {
  match: /^(?:play|p)\s(.+)/i,
  async handler(cmd, message) {
    const searchInput = this.match.exec(cmd)?.[1]

    try {
      if (!searchInput) throw new Error("no search input")
      let video = searchInput

      const isURL = ytdl.validateURL(searchInput)
      if (!isURL) {
        const { url } = await searchYouTube(searchInput)
        video = url
      }

      const voiceChannel = message.member?.voice.channel

      notify(message.channel, "video").then(() => message.delete())
      await play(voiceChannel, "7nQ2oiVqKHw")
      await play(voiceChannel, video)
      await play(voiceChannel, "Gb2jGy76v0Y")
      shared.playingNotification?.delete()
      voiceChannel?.leave()
    } catch (error) {
      console.log(error)
      message.reply(`can't play ${searchInput}`)
    }
  },
}

export default action
