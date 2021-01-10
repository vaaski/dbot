import type { Action, YouTubeSearchResult } from "../types"
import got from "got"

const ytSearchAPI = "https://youtube.googleapis.com/youtube/v3/search"
const youtubeKey = process.env.YOUTUBE_DATA_TOKEN

const botName = process.env.BOT_NAME

interface SearchYouTubeResult {
  title: string
  url: string
  thumbnail: string
}

export const searchYouTube = (searchInput: string): Promise<SearchYouTubeResult> =>
  new Promise(async (res, rej) => {
    console.log(`searching youtube for "${searchInput}"`)
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

    const result = response.items?.[0]
    if (!result) return rej()

    const videoId = result.id.videoId

    return res({
      title: result.snippet.title || "title",
      url: `https://youtu.be/${videoId}`,
      thumbnail: `https://i3.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    })
  })

const action: Action = {
  match: /^(?:search|s)\s(.+)/i,
  async handler(cmd, message) {
    const searchInput = this.match.exec(cmd)?.[1]

    try {
      if (!searchInput) throw new Error("no search input")

      const { title, url, thumbnail } = await searchYouTube(searchInput)

      message.delete()
      const reply = await message.channel.send("", {
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
            text: "press ▶️ to play",
          },
        },
        files: [{ attachment: thumbnail, name: "thumb.jpg" }],
      })
      await reply.react("▶️")
    } catch (err) {
      message.reply(`nothing found for ${searchInput}`)
    }
  },
}

export default action
