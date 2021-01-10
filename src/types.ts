import type * as Discord from "discord.js"

export type NotifyChannel = Discord.TextChannel

export interface Action {
  match: RegExp
  handler(cmd: string, message: Discord.Message): Promise<any>
}
export type Actions = Action[]

export interface YouTubeSearchResult {
  kind: string
  etag: string
  nextPageToken: string
  regionCode: string
  pageInfo: PageInfo
  items?: ItemsEntity[] | null
}
export interface PageInfo {
  totalResults: number
  resultsPerPage: number
}
export interface ItemsEntity {
  kind: string
  etag: string
  id: Id
  snippet: Snippet
}
export interface Id {
  kind: string
  videoId: string
}
export interface Snippet {
  publishedAt: string
  channelId: string
  title: string
  description: string
  thumbnails: Thumbnails
  channelTitle: string
  liveBroadcastContent: string
  publishTime: string
}
export interface Thumbnails {
  default: DefaultOrMediumOrHigh
  medium: DefaultOrMediumOrHigh
  high: DefaultOrMediumOrHigh
}
export interface DefaultOrMediumOrHigh {
  url: string
  width: number
  height: number
}
