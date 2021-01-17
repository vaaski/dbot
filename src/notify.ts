import type { Queue } from "./queue"
import type { Message } from "discord.js"

import { constants, shared } from "./index"

let lastMessage: undefined | string

const react = async (message: Message) => {
  const { playpause, volDown, volUp, stop, earpain, skip } = constants.emoji

  await message.react(playpause)
  await message.react(skip)
  await message.react(volDown)
  await message.react(volUp)
  await message.react(stop)
  // await message.react(earpain)
}

export const notify = async (queue: Queue) => {
  const textChannel = shared.textChannel
  if (!textChannel) return console.log("no text channel")

  const { playing, list } = queue
  const next = list.map((t) => t.title).join("\nthen ")
  let message = `> playing ${playing?.title || "startup sound"}`
  if (list.length) message += "\nthen " + next

  if (message === lastMessage) return console.log("message is the same")
  lastMessage = message

  if (!shared.playingNotification) {
    shared.playingNotification = await textChannel.send(message)
    await react(shared.playingNotification)
  } else {
    shared.playingNotification.edit(message)
  }
}

export const deleteNotification = async () => {
  const playingNotification = shared.playingNotification
  if (!playingNotification) return console.log("no notification to delete")
  console.log("delete notification")

  playingNotification
    .delete()
    .catch((reason) => console.log(`cant delete playing notification ${reason}`))
    .then(() => {
      shared.playingNotification = undefined
      lastMessage = undefined
    })
}
