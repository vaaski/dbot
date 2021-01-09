import type { Action, YouTubeSearchResult } from "../types"
import got from "got"

const ytSearchAPI = "https://youtube.googleapis.com/youtube/v3/search"
const youtubeKey = process.env.YOUTUBE_DATA_TOKEN

const botName = process.env.BOT_NAME

const action: Action = {
  match: /^(?:search|s)\s(.+)/i,
  async handler(cmd, message) {
    const searchInput = this.match.exec(cmd)?.[1]
    if (!searchInput) return

    const start = +new Date()
    const response = (
      await got.get(ytSearchAPI, {
        searchParams: {
          part: "snippet",
          maxResults: 1,
          q: searchInput,
          type: "video",
          key: youtubeKey,
        },
        responseType: "json",
      })
    ).body as YouTubeSearchResult
    console.log(`took ${+new Date() - start}ms`)

    const result = response.items?.[0]
    if (!result) return message.reply(`nothing found for ${searchInput}`)

    const title = result.snippet.title || "title"
    const videoId = result.id.videoId
    const url = `https://youtu.be/${videoId}`
    const thumbnail = `https://i3.ytimg.com/vi/${videoId}/mqdefault.jpg`

    await message.channel.send("", {
      embed: {
        thumbnail: {
          url: "attachment://thumb.jpg",
        },
        title,
        url,
        author: {
          name: botName,
        },
        color: "#FF0000",
        footer: {
          text: "press ⏯️ to play",
        },
      },
      files: [{ attachment: thumbnail, name: "thumb.jpg" }],
    })
  },
}

export default action
