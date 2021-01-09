import * as Discord from "discord.js"

const client = new Discord.Client()
console.log("starting discord bot")

client.once("ready", () => {
  console.log("bot connected")
})

client.login(process.env.DISCORD_TOKEN)
