import type { Action, YouTubeSearchResult } from "../types"
import got from "got"
import ytsr from "ytsr"
import { shared } from ".."

const ytSearchAPI = "https://youtube.googleapis.com/youtube/v3/search"
const youtubeKey = process.env.YOUTUBE_DATA_TOKEN

const botName = process.env.BOT_NAME

interface SearchYouTubeResult {
  title: string
  url: string
  thumbnail: string
  via: "ytsr" | "api"
}

export const searchYouTube = (searchInput: string): Promise<SearchYouTubeResult> =>
  new Promise(async (res, rej) => {
    console.log(`searching youtube for "${searchInput}"`)
    try {
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
        via: "api",
      })
    } catch (err) {
      const filter = await ytsr.getFilters(searchInput)
      const videoFilter = filter.get("Type")?.get("Video")
      if (!videoFilter?.url) return

      const response = await ytsr(videoFilter.url, { limit: 1 })

      const result = response.items[0] as ytsr.Video
      if (!result) return rej()

      return res({
        title: result.title || "title",
        url: `https://youtu.be/${result.id}`,
        thumbnail: `https://i3.ytimg.com/vi/${result.id}/mqdefault.jpg`,
        via: "ytsr",
      })
    }
  })

const action: Action = {
  match: /^(?:search|s)\s(.+)/i,
  async handler(cmd, message) {
    const searchInput = this.match.exec(cmd)?.[1]
    const start = Date.now()

    try {
      if (!searchInput) throw new Error("no search input")

      const { title, url, thumbnail, via } = await searchYouTube(searchInput)

      const description = `${message.author.username} searched for \`${searchInput}\``
      const reply = await message.channel.send(description, {
        embed: {
          thumbnail: {
            url: "attachment://thumb.jpg",
          },
          title,
          url,
          author: {
            name: `${botName} search (${Date.now() - start}ms) via ${via}`,
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
      console.log("search error", err)
      shared.textChannel?.send(`nothing found for ${searchInput}`)
    }
  },
}

export default action
