import { mkdirSync } from "fs";
import { Bot } from "grammy";
import { addSubscriber, getSubscribers, removeSubscriber, subscribersDir } from "./data";
import { getSwapRate } from "./spot";
import { sleep } from "./util";

const botToken = process.env.BOT_TOKEN

if (!botToken) {
  throw new Error('BOT_TOKEN not set in environment variable')
}

const bot = new Bot(botToken)

let currentPrice = ''

;(async () => {
  currentPrice = (await getSwapRate()).toFixed(5)
})()

// Add user to subscriber list and send initial price update
bot.command("start", async (ctx) => {
  const { chatId } = ctx
  addSubscriber(chatId)

  ctx.api.sendMessage(chatId, 'Use /unsub to unsubscribe anytime.')

  while(currentPrice === '') {
    // eslint-disable-next-line no-await-in-loop
    await sleep(100)
  }

  ctx.api.sendMessage(chatId, currentPrice)
})

// Add user to subscriber list
bot.command("unsub", async (ctx) => {
  const { chatId } = ctx
  removeSubscriber(chatId)

  ctx.api.sendMessage(chatId, 'Unsubscribed.')
})

// Start the bot
bot.start()

mkdirSync(subscribersDir, { recursive: true })

setInterval(async () => {
  const swapRate = await getSwapRate()
  const swapRateRounded = swapRate.toFixed(5)

  if (swapRateRounded === currentPrice) return

  currentPrice = swapRateRounded

  for (const subscriber of Object.keys(await getSubscribers())) {
    bot.api.sendMessage(subscriber, swapRateRounded)
  }
}, 5000);
